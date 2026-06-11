from crewai import Agent
from crewai import LLM


def create_message_composer(llm: LLM) -> Agent:
    return Agent(
        role="Marketing Copywriter & Channel Strategist",
        goal="Write compelling, personalized campaign messages for a given audience and channel, always producing two variants for A/B consideration.",
        backstory="You are a senior marketing copywriter who has written thousands of D2C campaign messages. You always write two message variants so marketers can choose or A/B test.",
        llm=llm,
        verbose=False,
    )
