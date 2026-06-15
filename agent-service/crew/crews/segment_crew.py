import os
import json
from crewai import Crew, Process, Task
from crew.llm_config import get_llm
from crew.agents.segment_generator_agent import (
    create_segment_generator_agent,
    set_segment_http_tool,
    save_segments_tool,
)


class SegmentCrew:
    def __init__(self):
        self.llm = get_llm()
        self.agent = create_segment_generator_agent(self.llm)

    def run(self, context: dict) -> dict:
        base_url = os.getenv('BACKEND_URL', 'http://localhost:8000')
        token = context.get('token', '')
        user_prompt = context.get('prompt', '')

        set_segment_http_tool(base_url, token)

        prompt_section = ""
        if user_prompt:
            prompt_section = (
                "\n\nADDITIONAL USER INSTRUCTIONS:\n"
                "The user has provided specific guidance for segment creation. "
                "Follow it carefully alongside the distribution data below. You may "
                "create fewer or more segments than the default range if the user's "
                "request demands it.\n\n"
                f"\"{user_prompt}\""
            )

        task = Task(
            description=f"""You are the AI Segmentation Engine for Xeno CRM.

WORKFLOW (follow in order):
1. Call fetch_customer_distributions to load a current view of the customer base.
   Never invent distribution data.
2. Analyze the distributions to identify meaningful, high-value audience segments.
3. Design precise segment definitions with executable MongoDB filter rules.
4. Call save_segments with the JSON array to persist them.

SEGMENT TYPES TO CONSIDER (pick the ones the data actually supports):
- VIP / High-Value — LTV in top percentile (anchor to the actual distribution)
- At-Risk — High LTV but no purchase in 45+ days
- New Customers — Acquired in the last 30 days
- Loyal — 3+ orders with recent activity
- Win-Back — Previously active, now lapsing (30–60 days)
- High-Potential — New, but with high first-purchase value
- Category Buyers — Based on purchase category

SEGMENT SCHEMA (every segment MUST have):
- name: short descriptive name (e.g. "VIP Customers", "At-Risk High-Value")
- description: 1–2 sentences describing who this segment is and why it matters
- filterRules: array of {{field, operator, value}}
  - field options: ltv, totalOrders, last_order_days, city, gender, age, tags, category
  - numeric operators: gt, gte, lt, lte, eq
  - text operator: contains (regex match)
  - last_order_days uses a numeric day count
- logic: "AND" (default) or "OR" (only when the rules are genuinely disjunctive)

DEFAULT TARGET: produce 5–8 segments unless the user instructions say otherwise.
{prompt_section}

EXAMPLE SEGMENT:
[
  {{
    "name": "VIP Customers",
    "description": "Top-spending customers with LTV above ₹10,000 and strong purchase history.",
    "filterRules": [{{"field": "ltv", "operator": "gte", "value": 10000}}],
    "logic": "AND"
  }}
]

RULES:
- Anchor every threshold in the actual distribution buckets you fetched.
- Never invent fields outside the list above.
- Default logic is "AND".

OUTPUT DISCIPLINE:
After save_segments succeeds, return ONLY the raw JSON array of segments —
no markdown, no code fences, no commentary.""",
            expected_output='A JSON array of segment definitions persisted via save_segments.',
            agent=self.agent,
        )

        crew = Crew(
            agents=[self.agent],
            tasks=[task],
            process=Process.sequential,
            function_calling_llm=self.llm,
            verbose=False,
        )

        result = crew.kickoff()
        return self._parse_result(result)

    def _parse_result(self, result) -> dict:
        if result and getattr(result, 'raw', None):
            try:
                return json.loads(result.raw)
            except:
                pass
        return {"segments": []}
