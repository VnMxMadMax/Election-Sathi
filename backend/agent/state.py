"""
Agent state schema for the Civic Education chatbot.
Tracks conversation history, user country, and current education phase.
"""
from typing import Annotated, Optional
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    """
    Stateful context maintained across the LangGraph conversation graph.

    Attributes:
        messages: Full conversation history (HumanMessage + AIMessage).
                  add_messages reducer appends new messages on each turn.
        country:  User's selected country (None until user provides it).
        phase:    Current education phase the user is in.
                  Values: 'intro' | 'pre_election' | 'campaigning' |
                          'voting_day' | 'counting' | 'participation' | 'done'
        turn_count: Number of completed conversation turns for phase gating.
    """
    messages: Annotated[list, add_messages]
    country: Optional[str]
    phase: str
    turn_count: int
