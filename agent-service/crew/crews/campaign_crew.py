import random
from crewai import Crew, Process, Task
from crew.llm_config import get_llm
from crew.agents.campaign_synthesizer import create_campaign_synthesizer
from schemas.responses import CampaignDetailsResult


ALLOWED_AUDIENCES = [
    "Active Buyers",
    "At risk of losing buyers",
    "VIP",
    "New Buyers",
    "Value Buyers",
]

PRODUCT_CATEGORIES = [
    "Fashion",
    "Beauty & Personal Care",
    "Electronics",
    "Home & Kitchen",
    "Health & Wellness",
    "Sports & Fitness",
    "Books & Stationery",
    "Toys & Games",
    "Groceries",
    "Jewelry & Accessories",
]


class CampaignCrew:
    def __init__(self):
        self.llm = get_llm()
        self.synthesizer = create_campaign_synthesizer(self.llm)

    def run(self, user_message: str, context: dict) -> list[dict]:
        fallback_category = random.choice(PRODUCT_CATEGORIES)

        task = Task(
            description=f"""You are a D2C marketing campaign strategist.

USER REQUEST:
\"\"\"{user_message}\"\"\"

YOUR JOB:
Produce one campaign plan as STRICT JSON. Follow these rules exactly.

1. "Campaign Title" - a compelling, concise campaign name (5-10 words).

2. "Target Audience" - MUST be EXACTLY ONE of these five values (copy verbatim, including capitalization):
   {ALLOWED_AUDIENCES}
   Infer the best match from the user's request. Mapping hints:
   - "loyal" / "active" / "repeat buyers" -> "Active Buyers"
   - "inactive" / "lapsed" / "winback" / "reactivation" / "churning" -> "At risk of losing buyers"
   - "vip" / "high spend" / "top tier" / "premium" -> "VIP"
   - "new" / "first time" / "welcome" / "onboarding" -> "New Buyers"
   - "value" / "mid tier" / "growing" / "engaged but not vip" -> "Value Buyers"

3. "Description" - a crisp 2-3 sentence summary of the campaign strategy. Cover the goal, the message angle, and why it will work for this segment.

4. "ProductCategory" - choose from this list ONLY:
   {PRODUCT_CATEGORIES}
   Rules:
   - If the user request explicitly names a product or category (e.g. "skincare", "shoes", "sneakers", "headphones", "novels"), pick the closest match from the list.
   - If the user request does NOT name any product or category, use exactly: "{fallback_category}"

OUTPUT FORMAT:
Return ONLY raw JSON. No markdown, no code fences, no commentary.
Exact shape:
{{
  "CampaignDetails": {{
    "Campaign Title": "...",
    "Target Audience": "...",
    "Description": "...",
    "ProductCategory": "..."
  }}
}}""",
            expected_output=(
                'A single JSON object: {"CampaignDetails": {"Campaign Title": str, '
                '"Target Audience": one of the five allowed values, "Description": str, '
                '"ProductCategory": one of the listed categories}}. No prose, no fences.'
            ),
            agent=self.synthesizer,
            output_pydantic=CampaignDetailsResult,
        )

        crew = Crew(
            agents=[self.synthesizer],
            tasks=[task],
            process=Process.sequential,
            function_calling_llm=self.llm,
            verbose=False,
        )

        result = crew.kickoff()
        return self._parse_to_events(result, user_message, fallback_category)

    def _parse_to_events(self, result, user_message: str, fallback_category: str) -> list[dict]:
        events = []
        events.append({"type": "text", "content": f"Analyzing your brief: \"{user_message}\""})

        details_payload = None
        if result and getattr(result, "pydantic", None):
            details_payload = result.pydantic.model_dump(by_alias=True)

        if not details_payload:
            details_payload = {
                "CampaignDetails": {
                    "Campaign Title": "Custom Marketing Campaign",
                    "Target Audience": "Active Buyers",
                    "Description": (
                        f"A campaign tailored to your brief: \"{user_message}\". "
                        "Refine the audience and angle before launch."
                    ),
                    "ProductCategory": fallback_category,
                }
            }

        events.append({"type": "text", "content": "Here is your campaign:"})
        events.append({"type": "campaign_details", "data": details_payload})
        events.append({"type": "done"})
        return events
