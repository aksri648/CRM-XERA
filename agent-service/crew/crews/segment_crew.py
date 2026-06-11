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

        set_segment_http_tool(base_url, token)

        task = Task(
            description="""You are the AI Segmentation Engine for Xeno CRM.

Your job:
1. Use fetch_customer_distributions to get a comprehensive view of the customer base
2. Analyze the distributions to identify 5-8 meaningful audience segments
3. Create precise segment definitions with MongoDB filter rules
4. Use save_segments to store them in the database

Segment types to consider:
- VIP / High-Value: LTV in top percentile (e.g., >₹10,000 or >₹5,000)
- At-Risk: High LTV but haven't purchased in 45+ days
- New Customers: Acquired in last 30 days
- Loyal Customers: 3+ orders, high recency
- Win-Back Candidates: Previously active, now lapsing (30-60 days)
- High-Potential: New but with high first purchase value
- Category Buyers: Based on purchase categories (fashion, electronics, etc.)

Each segment MUST have:
- name: short descriptive name (e.g., "VIP Customers", "At-Risk High-Value")
- description: 1-2 sentence explanation of who this segment is
- filterRules: array of {field, operator, value}
  - field options: ltv, totalOrders, last_order_days, city, gender, age, tags, category
  - operator options for numeric: gt, gte, lt, lte, eq
  - operator options for text: contains (regex match)
  - For last_order_days: use value as number of days
- logic: "AND" to combine rules (almost always use AND)

IMPORTANT: Output a JSON array of segments to be saved. Use the save_segments tool to save them.

Example segment:
[
  {
    "name": "VIP Customers",
    "description": "Top-spending customers with LTV above ₹10,000 who demonstrate strong purchase history",
    "filterRules": [{"field": "ltv", "operator": "gte", "value": 10000}],
    "logic": "AND"
  }
]

Return ONLY the JSON array - no explanation, no markdown, just the raw JSON for save_segments.""",
            expected_output='A JSON array of segment definitions to save to the database.',
            agent=self.agent,
        )

        crew = Crew(
            agents=[self.agent],
            tasks=[task],
            process=Process.sequential,
            function_calling_llm=self.llm,
            verbose=True,
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