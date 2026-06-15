import random
from crewai import Crew, Process, Task
from crew.llm_config import get_llm
from crew.agents.campaign_synthesizer import create_campaign_synthesizer
from schemas.responses import CampaignDetailsResult


SUGGESTED_AUDIENCES = [
    "Active Buyers",
    "At risk of losing buyers",
    "VIP",
    "New Buyers",
    "Value Buyers",
]

SUGGESTED_CATEGORIES = [
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
    "Food & Beverage",
    "Travel",
    "Education",
    "Finance",
    "SaaS",
]


class CampaignCrew:
    def __init__(self):
        self.llm = get_llm()
        self.synthesizer = create_campaign_synthesizer(self.llm)

    def run(self, user_message: str, context: dict) -> list[dict]:
        fallback_category = random.choice(SUGGESTED_CATEGORIES)

        task = Task(
            description=f"""You are the D2C Campaign Strategist for Xeno CRM.

USER BRIEF:
\"\"\"{user_message}\"\"\"

YOUR JOB:
Produce ONE complete, launch-ready campaign blueprint as STRICT JSON.

GUIDANCE (NOT enforcement):
- Common CRM audiences are: {SUGGESTED_AUDIENCES}. Use one of these when the
  brief maps cleanly. Otherwise use the most specific audience label the
  brief actually describes — niche cohorts, B2B personas, life-stage cohorts,
  geo-specific cohorts are all valid.
- Common product categories are: {SUGGESTED_CATEGORIES}. Use one of these
  when it fits. Otherwise coin a new Title-Case category that fits the
  product or service.
- If the brief is silent on category, default to: "{fallback_category}".

REQUIRED FIELDS (every field MUST be present):

1. "Campaign Title" — 5–10 words, action-oriented, no emojis, no trailing
   punctuation.

2. "Target Audience" — the most specific accurate label. Free-form string.

3. "Description" — 2–4 sentences. Goal, angle, why it will land for this
   audience.

4. "ProductCategory" — best-fit category. Title Case.

5. "Tagline" — ONE short tagline (≤ 10 words) that captures the campaign's
   emotional hook.

6. "AudiencePersona" — 1–2 sentences describing the customer in human terms
   (e.g. "Urban 25–34 women, value-driven, shop weekend mornings on mobile").

7. "RecommendedChannel" — one of: whatsapp, email, sms, rcs, instagram, push.

8. "Tone" — one short phrase (e.g. "warm and aspirational",
   "urgent and direct").

9. "Catchphrases" — array of 3–5 punchy hooks the marketer can lift into
   creative. Each ≤ 8 words, no clichés unless the brief is urgency-driven.

10. "MessageVariants" — array of EXACTLY 2 objects:
    {{
      "label": "Variant A" | "Variant B",
      "subject": "<email subject line, ≤ 60 chars; empty string for non-email>",
      "body": "<message body respecting channel limits>",
      "cta": "<short call-to-action button text>"
    }}
    Variant A and Variant B MUST use different angles (emotional vs. value-led,
    aspirational vs. utility, etc.) — not reworded copy.
    Channel limits: SMS ≤ 160 chars, WhatsApp ≤ 300 chars and ≤ 1 emoji,
    email body 2–4 sentences, push ≤ 100 chars.

11. "CTA" — primary call-to-action across variants
    (e.g. "Shop the drop", "Claim your spot").

12. "SendTimeSuggestion" — concrete window in IST
    (e.g. "Tue 11:00 IST", "Weekend evenings 19:00–21:00 IST").

13. "PersonalizationTokens" — array of merge fields the variants use
    (e.g. ["first_name", "last_order_category", "city"]).

14. "KPIs" — array of EXACTLY 3 measurable success metrics
    (e.g. ["open rate > 35%", "click rate > 5%", "revenue > ₹2L"]).

15. "ConfidenceScore" — float in [0, 1] reflecting how well-specified the
    brief was.

16. "AIReasoning" — one short paragraph explaining the strategic choice of
    audience × category × angle × channel.

OUTPUT FORMAT:
Return ONLY raw JSON. No markdown, no code fences, no commentary.
Exact shape:
{{
  "CampaignDetails": {{
    "Campaign Title": "...",
    "Target Audience": "...",
    "Description": "...",
    "ProductCategory": "...",
    "Tagline": "...",
    "AudiencePersona": "...",
    "RecommendedChannel": "whatsapp|email|sms|rcs|instagram|push",
    "Tone": "...",
    "Catchphrases": ["...", "...", "..."],
    "MessageVariants": [
      {{"label": "Variant A", "subject": "...", "body": "...", "cta": "..."}},
      {{"label": "Variant B", "subject": "...", "body": "...", "cta": "..."}}
    ],
    "CTA": "...",
    "SendTimeSuggestion": "...",
    "PersonalizationTokens": ["..."],
    "KPIs": ["...", "...", "..."],
    "ConfidenceScore": 0.0,
    "AIReasoning": "..."
  }}
}}""",
            expected_output=(
                'A single JSON object {"CampaignDetails": {...}} with all 16 fields '
                'specified above. Catchphrases has 3–5 items, MessageVariants has '
                'exactly 2 items with distinct angles, KPIs has exactly 3 items. '
                'No prose outside the schema, no markdown fences.'
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
                    "Tagline": "",
                    "AudiencePersona": "",
                    "RecommendedChannel": "whatsapp",
                    "Tone": "",
                    "Catchphrases": [],
                    "MessageVariants": [],
                    "CTA": "",
                    "SendTimeSuggestion": "",
                    "PersonalizationTokens": [],
                    "KPIs": [],
                    "ConfidenceScore": 0.0,
                    "AIReasoning": "Fallback response — model did not return a structured plan.",
                }
            }

        events.append({"type": "text", "content": "Here is your campaign blueprint:"})
        events.append({"type": "campaign_details", "data": details_payload})
        events.append({"type": "done"})
        return events
