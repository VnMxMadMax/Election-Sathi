"""
LangGraph StateGraph definition for the Civic Education Agent.

Graph topology:
  START → civic_agent → END

Single-node graph with stateful message accumulation via add_messages reducer.
The node handles all phase-transition logic internally.
"""
import functools
import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, START, END

from agent.state import AgentState
from agent.nodes import civic_agent_node

logger = logging.getLogger(__name__)


def build_graph(llm: ChatGoogleGenerativeAI) -> StateGraph:
    """
    Construct and compile the LangGraph conversation graph.

    The graph is intentionally kept as a single-node design because
    the conversation is sequential with no parallel branches.
    Phase-routing logic lives in the node itself for clear traceability.

    Args:
        llm: A pre-configured ChatOpenAI instance.

    Returns:
        A compiled LangGraph runnable (CompiledStateGraph).
    """
    # Bind LLM to the node via functools.partial (dependency injection pattern)
    node_with_llm = functools.partial(civic_agent_node, llm=llm)

    builder = StateGraph(AgentState)
    builder.add_node("civic_agent", node_with_llm)
    builder.add_edge(START, "civic_agent")
    builder.add_edge("civic_agent", END)

    compiled = builder.compile()
    logger.info("CivicGuide LangGraph compiled successfully.")
    return compiled
