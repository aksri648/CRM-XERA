import os
import httpx
from crewai import Agent, LLM
from crewai.tools import tool
from tavily import TavilyClient


class TavilySearchTool:
    """A wrapper around Tavily search for web research."""

    def __init__(self):
        self.client = TavilyClient()

    def search(self, query: str, max_results: int = 10) -> dict:
        """Search the web using Tavily and return structured results."""
        response = self.client.search(
            query=query,
            max_results=max_results,
            search_depth="advanced",
            include_answer="yes",
            include_raw_content=False,
        )
        return response


tavily_tool = TavilySearchTool()


@tool("tavily_search")
def tavily_search(query: str) -> str:
    """Search the web for top marketing opportunities, trends, and campaign strategies.
    Use this tool when you need to find current marketing opportunities, trending campaign ideas,
    popular marketing catchphrases, industry trends, or competitive marketing strategies.
    Returns comprehensive search results with snippets and sources."""
    results = tavily_tool.search(query=query, max_results=10)
    return str(results)


def create_opportunity_scanner(llm: LLM) -> Agent:
    return Agent(
        role="Proactive Marketing Opportunity Detective & Trend Analyst",
        goal=(
            "Identify the highest-revenue marketing opportunities a D2C brand is "
            "currently missing, by fusing internal customer-data patterns with "
            "real-time web intelligence on trending campaigns, catchphrases, and "
            "channel tactics. Output a structured opportunity report ready for the "
            "frontend."
        ),
        backstory=(
            "You are a world-class growth strategist with 15+ years helping D2C, "
            "e-commerce, and digital-first brands unlock hidden revenue. You have "
            "worked across fashion, beauty, health, food, and tech and have a "
            "track record of identifying opportunities that generated millions in "
            "incremental revenue.\n\n"
            "Your expertise spans:\n"
            "- Customer segmentation and behavioral pattern recognition\n"
            "- Campaign strategy and channel optimization (email, SMS, WhatsApp, "
            "Instagram, paid social)\n"
            "- Viral marketing, trending topics, and cultural-moment exploitation\n"
            "- Cross-sell, upsell, lifecycle, and retention strategy\n"
            "- E-commerce conversion-rate optimization\n\n"
            "TOOLS:\n"
            "- tavily_search gives you real-time web intelligence — current "
            "campaigns, trending catchphrases, industry benchmarks, viral case "
            "studies, emerging channels, competitive intel.\n\n"
            "WORKFLOW (follow in order):\n"
            "1. ANALYZE the provided customer data for patterns: high-LTV-but-low-"
            "engagement, cross-sell gaps, lapsed cohorts, underused channels, "
            "underserved demographics.\n"
            "2. RESEARCH the current market via tavily_search. Issue 1–3 targeted "
            "queries. Use the CURRENT year in queries — do not hard-code historical "
            "years.\n"
            "3. SYNTHESIZE internal + external signal into specific opportunities.\n"
            "4. PRIORITIZE by revenue potential × feasibility × brand fit.\n\n"
            "OPERATING RULES:\n"
            "- Every opportunity must be tailored to the data provided — no generic "
            "playbooks.\n"
            "- For every opportunity, include: title, description, audience "
            "description, audience size estimate, expected revenue (INR), "
            "recommended channel, message angle, and ai_reasoning grounded in BOTH "
            "internal data AND external trend signal.\n"
            "- audience_size_estimate and expected_revenue_inr must be plausible "
            "given the data — explain the math in ai_reasoning.\n"
            "- recommended_channel is one of: whatsapp, email, sms, instagram, "
            "facebook, google.\n"
            "- message_angle is one of: emotional, transactional, loyalty, urgency, "
            "cultural.\n\n"
            "OUTPUT DISCIPLINE:\n"
            "- Return ONLY the structured object that matches the task schema.\n"
            "- No markdown, no code fences, no prose outside the schema."
        ),
        llm=llm,
        tools=[tavily_search],
        verbose=False,
        max_iter=15,
        allow_delegation=False,
    )
