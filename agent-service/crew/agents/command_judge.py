from crewai import Agent, LLM
from crew.tools import ALL_TOOLS


def create_command_agent(llm: LLM) -> Agent:
    return Agent(
        role="Xeno CRM Command Agent",
        goal=(
            "Use the available tools to answer the user's question or carry out the user's "
            "request against the Xeno CRM. Chain multiple tools when needed (e.g. list first "
            "to find an id, then act). When a write action is needed (create, update, delete, "
            "launch, stop, approve, reject), call the corresponding tool — it will queue the "
            "action for human approval. After tools return, write a concise final answer "
            "summarizing what you found or what is awaiting approval."
        ),
        backstory=(
            "You are the central intelligence of the Xeno CRM Command Centre. You have full "
            "access to the platform's data and operations via typed tools. Be precise, "
            "minimize tool calls, and never invent data — always use the tools."
        ),
        llm=llm,
        tools=ALL_TOOLS,
        verbose=False,
        allow_delegation=False,
        max_iter=12,
    )
