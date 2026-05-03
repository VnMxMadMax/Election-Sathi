"""
LangGraph node definitions for the Civic Education Agent.

Each node is a pure function: (state) -> state_update dict.
Nodes handle the core AI reasoning and phase transition logic.
"""
import re
import logging
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from agent.state import AgentState
from agent.prompts import SYSTEM_PROMPT, PHASE_TRANSITION_INSTRUCTIONS

logger = logging.getLogger(__name__)

# Phase order for automatic progression
PHASE_ORDER = [
    "intro",
    "pre_election",
    "campaigning",
    "voting_day",
    "counting",
    "participation",
    "done",
]

# Turns required in each phase before auto-advancing (user replies = 1 turn minimum)
PHASE_MIN_TURNS = {
    "intro": 1,
    "pre_election": 2,
    "campaigning": 2,
    "voting_day": 2,
    "counting": 2,
    "participation": 2,
    "done": 0,
}

# Keywords that indicate user wants to advance to the next topic
ADVANCE_KEYWORDS = frozenset([
    "next", "continue", "move on", "got it", "understood", "ok", "okay",
    "yes", "sure", "let's continue", "proceed", "what's next", "keep going",
])


def _extract_country(messages: list) -> str | None:
    """
    Attempt to extract a country name from the last user message.
    Returns None if no country detected.
    """
    if not messages:
        return None

    last_human = next(
        (m for m in reversed(messages) if isinstance(m, HumanMessage)),
        None
    )
    if not last_human:
        return None

    text = last_human.content.strip()
    # Simple heuristic: if the message is short (< 5 words) and not a question,
    # treat it as a country name response.
    words = text.split()
    if len(words) <= 5 and "?" not in text:
        return text.title()

    # Check for "I'm from X" / "my country is X" patterns
    patterns = [
        r"(?:i(?:'m| am) from|my country is|for)\s+([A-Za-z\s]+)",
        r"^([A-Za-z\s]+)$",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            candidate = match.group(1).strip().title()
            if len(candidate.split()) <= 4:  # Countries are at most 4 words
                return candidate

    return None


def _should_advance_phase(state: AgentState) -> bool:
    """
    Determine if the conversation should advance to the next phase.
    Advances if: minimum turns met AND user signals readiness.
    """
    current_phase = state["phase"]
    min_turns = PHASE_MIN_TURNS.get(current_phase, 1)

    if state["turn_count"] < min_turns:
        return False

    last_human = next(
        (m for m in reversed(state["messages"]) if isinstance(m, HumanMessage)),
        None
    )
    if not last_human:
        return False

    text = last_human.content.lower().strip()
    return any(keyword in text for keyword in ADVANCE_KEYWORDS)


def _build_phase_system_message(state: AgentState) -> str:
    """
    Build the phase-specific instruction block to inject into the system prompt.
    Formats country placeholder safely.
    """
    phase = state["phase"]
    country = state.get("country") or "the user's country"
    instruction = PHASE_TRANSITION_INSTRUCTIONS.get(phase, "")
    return instruction.format(country=country)


def civic_agent_node(state: AgentState, llm: ChatGoogleGenerativeAI) -> dict:
    """
    Core LangGraph node: runs the LLM with the full system context and
    returns the updated state slice.
    """
    turn_count = state.get("turn_count", 0)

    # --- Build Messages for LLM ---
    full_system = SYSTEM_PROMPT

    llm_messages = [SystemMessage(content=full_system)] + list(state["messages"])

    # --- LLM Call ---
    try:
        response = llm.invoke(llm_messages)
    except Exception as exc:
        logger.error("LLM invocation failed: %s", exc, exc_info=True)
        raise RuntimeError(f"AI service unavailable: {exc}") from exc

    return {
        "messages": [response],
        "country": "India",
        "phase": "done",
        "turn_count": turn_count + 1,
    }
