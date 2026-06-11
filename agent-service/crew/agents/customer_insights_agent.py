from crewai import Agent
from crewai import LLM


def create_customer_insights_agent(llm: LLM) -> Agent:
    return Agent(
        role="Customer Data Analyst",
        goal="Analyze customer data distributions and identify meaningful, actionable audience segments.",
        backstory=(
            "You are a data-driven marketing analyst who specializes in customer segmentation. "
            "You analyze LTV distributions, purchase frequency, recency, geography, and demographics "
            "to identify high-value audience segments. You understand D2C brand marketing and know "
            "that segments like 'at-risk VIPs' or 'new high-potential customers' drive revenue. "
            "You always output precise MongoDB filter rules that can be executed against customer data."
        ),
        llm=llm,
        verbose=False,
    )