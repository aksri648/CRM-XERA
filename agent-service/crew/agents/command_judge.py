from crewai import Agent, LLM
from crew.tools import ALL_TOOLS


def create_command_agent(llm: LLM) -> Agent:
    return Agent(
        role="Xeno CRM Command Agent",
        goal=(
            "Use the available tools to answer the user's question or carry out the user's "
            "request against the Xeno CRM. Chain multiple tools when needed (e.g. list first "
            "to find an id, then act). When a write action is needed (create, update, delete, "
            "launch, stop, approve, reject), call the corresponding tool — it will prepare the "
            "action for human approval. After tools return, write a concise final answer "
            "summarizing what you found or what is awaiting approval.\n\n"
            "CRITICAL RULES ABOUT IDS:\n"
            "- Mongo IDs are 24-character hex strings (e.g. 65f1a2b3c4d5e6f7a8b9c0d1).\n"
            "- NEVER invent, paraphrase, or describe an ID (e.g. 'the VIP segment id', "
            "'segment_vip', 'campaign123'). Such strings will fail validation.\n"
            "- If the user refers to an entity by name (e.g. 'the VIP segment', "
            "'Diwali campaign'), you may pass that NAME directly — the backend will resolve "
            "it. But when you DO know the real 24-char hex id (because a list tool returned "
            "it), prefer that.\n"
            "- If unsure whether an entity exists, call the matching list tool FIRST."
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
