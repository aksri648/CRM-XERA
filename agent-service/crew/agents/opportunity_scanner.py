from crewai import Agent
from crewai import LLM


def create_opportunity_scanner(llm: LLM) -> Agent:
    return Agent(
        role="Proactive Marketing Opportunity Detective",
        goal="Autonomously scan customer data patterns to identify high-revenue marketing opportunities the brand may be missing.",
        backstory="You are a growth hacker who has helped 50+ D2C brands unlock hidden revenue. You look for patterns that humans miss.",
        llm=llm,
        verbose=False,
    )
