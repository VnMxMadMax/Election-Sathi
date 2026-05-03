"""
Pydantic v2 request/response schemas for the Civic Education API.
All external-facing data contracts are defined here.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional


class ChatRequest(BaseModel):
    """
    Incoming chat request from the frontend.
    session_id is used to retrieve the correct conversation thread.
    """
    session_id: str = Field(
        ...,
        min_length=8,
        max_length=64,
        description="Unique session identifier (UUID recommended)",
        examples=["550e8400-e29b-41d4-a716-446655440000"],
    )
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="User's input message",
    )

    @field_validator("message")
    @classmethod
    def strip_and_validate(cls, v: str) -> str:
        """Strip whitespace and block empty messages after stripping."""
        stripped = v.strip()
        if not stripped:
            raise ValueError("Message cannot be empty or whitespace only.")
        return stripped


class ChatResponse(BaseModel):
    """
    AI response returned to the frontend.
    """
    session_id: str
    reply: str = Field(..., description="The AI's response text")
    phase: str = Field(..., description="Current education phase")
    country: Optional[str] = Field(None, description="Detected user country")
    turn_count: int = Field(..., description="Number of turns in this session")


class SessionResetRequest(BaseModel):
    """Request to reset a conversation session."""
    session_id: str = Field(..., min_length=8, max_length=64)


class HealthResponse(BaseModel):
    """API health check response."""
    status: str
    version: str
