from crewai import Agent
from crewai import LLM


def create_intent_classifier(llm: LLM) -> Agent:
    return Agent(
        role="CRM Intent Router",
        goal="Analyze a user's natural language message and classify it into exactly one intent category, extracting key parameters.",
        backstory="You are an expert CRM analyst at a D2C brand. Your job is to understand what a marketer wants to accomplish and route their request to the right specialist. You are precise, fast, and always output clean JSON.",
        llm=llm,
        verbose=False,
    )
