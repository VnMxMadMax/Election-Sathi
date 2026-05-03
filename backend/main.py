"""
CivicGuide — FastAPI Backend Entry Point

Endpoints:
  POST /api/chat          — Send a user message, get AI response
  POST /api/session/reset — Reset a conversation session
  GET  /api/health        — Health check

Session state is held in-memory (per-process). For production, replace
`session_store` with Redis or a persistent store.
"""
import os
import logging
import uuid
from contextlib import asynccontextmanager
from functools import lru_cache

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from agent.graph import build_graph
from agent.state import AgentState
from models.schemas import (
    ChatRequest,
    ChatResponse,
    SessionResetRequest,
    HealthResponse,
)

# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# In-memory session store: session_id → AgentState
# Replace with Redis for multi-process / production deployments
session_store: dict[str, AgentState] = {}

# Rate limiter — keyed by client IP address
limiter = Limiter(key_func=get_remote_address)


# ---------------------------------------------------------------------------
# App Lifespan — initialise LLM + Graph once at startup
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: build the LangGraph compiled graph once and cache it."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "GEMINI_API_KEY is not set. "
            "Create a .env file in the backend directory with: GEMINI_API_KEY=..."
        )

    llm = ChatGoogleGenerativeAI(
        model=os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
        temperature=0.7,
        api_key=api_key,
        max_retries=0,  # Fail fast instead of hanging on 429 free-tier quota limits
    )

    app.state.graph = build_graph(llm)
    logger.info("CivicGuide API ready.")
    yield
    logger.info("CivicGuide API shutting down.")


# ---------------------------------------------------------------------------
# Allowed origins — restrict to known frontends
# ---------------------------------------------------------------------------
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
).split(",")


# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="CivicGuide API",
    description="AI-powered civic education chatbot — explains election processes worldwide.",
    version="1.0.0",
    lifespan=lifespan,
)

# Attach rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "GET"],     # Only methods we actually use
    allow_headers=["Content-Type"],     # Only headers we actually need
)


# ---------------------------------------------------------------------------
# Global error handler — sanitize all unhandled exceptions
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch unhandled exceptions and return a generic error.
    Never expose stack traces, file paths, or env var names to the client."""
    logger.error("Unhandled error on %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again later."},
    )


# ---------------------------------------------------------------------------
# Helper: get or create session state
# ---------------------------------------------------------------------------
def _get_or_create_session(session_id: str) -> AgentState:
    """Retrieve an existing session or initialise a fresh one."""
    if session_id not in session_store:
        session_store[session_id] = AgentState(
            messages=[],
            country=None,
            phase="intro",
            turn_count=0,
        )
        logger.info("New session created: %s", session_id)
    return session_store[session_id]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Returns API status and version. Used by frontend to verify connectivity."""
    return HealthResponse(status="operational", version="1.0.0")


@app.post("/api/chat", response_model=ChatResponse, tags=["Chat"])
@limiter.limit("10/minute")
async def chat(request: Request, payload: ChatRequest):
    """
    Process a user message and return the AI's response.

    Rate limited to 10 requests/minute per IP to prevent abuse of the
    underlying Gemini API.
    """
    state = _get_or_create_session(payload.session_id)

    # Append the new user message to existing state
    updated_state = {
        **state,
        "messages": list(state["messages"]) + [HumanMessage(content=payload.message)],
    }

    try:
        result = app.state.graph.invoke(updated_state)
    except RuntimeError as exc:
        logger.error("Graph invocation failed for session %s: %s", payload.session_id, exc)
        error_msg = str(exc)
        if "429" in error_msg or "Quota exceeded" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Election Sathi is experiencing high traffic (API rate limit exceeded). Please wait a minute and try again.",
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI service is temporarily unavailable. Please try again.",
        ) from exc

    # Persist updated state back to session store
    session_store[payload.session_id] = AgentState(
        messages=result["messages"],
        country=result.get("country"),
        phase=result.get("phase", "intro"),
        turn_count=result.get("turn_count", 0),
    )

    # Extract the AI's reply (last message is always the AI response)
    ai_reply = result["messages"][-1].content

    return ChatResponse(
        session_id=payload.session_id,
        reply=ai_reply,
        phase=result.get("phase", "intro"),
        country=result.get("country"),
        turn_count=result.get("turn_count", 0),
    )


@app.post(
    "/api/session/reset",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Session"],
)
@limiter.limit("5/minute")
async def reset_session(request: Request, payload: SessionResetRequest):
    """
    Reset a conversation session to its initial state.
    Useful when the user wants to start over with a different country.
    """
    if payload.session_id in session_store:
        del session_store[payload.session_id]
        logger.info("Session reset: %s", payload.session_id)
