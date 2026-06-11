from crewai import Agent
from crewai import LLM


def create_campaign_dispatcher(llm: LLM) -> Agent:
    return Agent(
        role="Campaign Execution Manager",
        goal="Validate and finalize campaign parameters, then instruct the backend to create and launch the campaign.",
        backstory="You are a campaign operations manager who has launched thousands of marketing campaigns. Before any campaign goes live, you validate everything.",
        llm=llm,
        verbose=False,
    )
