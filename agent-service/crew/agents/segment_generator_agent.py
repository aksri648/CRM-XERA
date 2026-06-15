import os
import httpx
from crewai import Agent, LLM
from crewai.tools import tool


class SegmentHttpTool:
    """Makes authenticated HTTP requests to the Xeno backend."""

    def __init__(self, base_url: str, token: str):
        self.base_url = base_url.rstrip('/')
        self.token = token
        self._client = None

    @property
    def client(self):
        if self._client is None:
            self._client = httpx.Client(
                base_url=self.base_url,
                headers={'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'},
                timeout=30.0,
            )
        return self._client

    def get(self, path: str, params: dict = None) -> dict:
        resp = self.client.get(path, params=params)
        resp.raise_for_status()
        return resp.json()

    def post(self, path: str, json: dict = None) -> dict:
        resp = self.client.post(path, json=json)
        resp.raise_for_status()
        return resp.json()


_segment_http_tool = None

def set_segment_http_tool(base_url: str, token: str):
    global _segment_http_tool
    _segment_http_tool = SegmentHttpTool(base_url, token)


@tool("fetch_customer_distributions")
def fetch_customer_distributions() -> str:
    """Fetch customer data distributions for segmentation analysis. Returns aggregated statistics about LTV bands, order counts, recency, cities, and demographics."""
    if _segment_http_tool is None:
        return '{"error": "Not initialized"}'
    try:
        data = _segment_http_tool.get('/api/customers/distributions')
        lines = ["CUSTOMER DATA DISTRIBUTIONS:"]
        if 'ltvDistribution' in data:
            lines.append(f"\nLTV Distribution (buckets):")
            for b in data['ltvDistribution']:
                lines.append(f"  - {b.get('bucket','?')}: {b.get('count',0)} customers, avg LTV: ₹{b.get('avgLtv',0)}")
        if 'orderCountDistribution' in data:
            lines.append(f"\nOrder Count Distribution:")
            for b in data['orderCountDistribution']:
                lines.append(f"  - {b.get('bucket','?')}: {b.get('count',0)} customers")
        if 'recencyDistribution' in data:
            lines.append(f"\nRecency Distribution (days since last order):")
            for b in data['recencyDistribution']:
                lines.append(f"  - {b.get('bucket','?')}: {b.get('count',0)} customers")
        if 'cityDistribution' in data:
            lines.append(f"\nTop Cities:")
            for b in data['cityDistribution'][:10]:
                lines.append(f"  - {b.get('_id','?')}: {b.get('count',0)} customers, avg LTV: ₹{b.get('avgLtv',0)}")
        if 'genderDistribution' in data:
            lines.append(f"\nGender Distribution:")
            for b in data['genderDistribution']:
                lines.append(f"  - {b.get('_id','?')}: {b.get('count',0)} customers")
        if 'totalCustomers' in data:
            lines.append(f"\nTotal Customers: {data['totalCustomers']}")
        return '\n'.join(lines)
    except Exception as e:
        return f'{{"error": "{str(e)}"}}'


@tool("save_segments")
def save_segments_tool(segments_json: str) -> str:
    """Save generated segments to the CRM database. Input must be a JSON string array of segments, each with name (string), description (string), filterRules (array of {field, operator, value}), and logic ('AND' or 'OR')."""
    if _segment_http_tool is None:
        return '{"error": "Not initialized"}'
    try:
        import json
        segments = json.loads(segments_json)
        if not isinstance(segments, list):
            return '{"error": "segments must be a JSON array"}'
        results = []
        for seg in segments:
            result = _segment_http_tool.post('/api/segments', json={
                'name': seg.get('name'),
                'description': seg.get('description', ''),
                'filterRules': seg.get('filterRules', []),
                'logic': seg.get('logic', 'AND'),
                'createdBy': 'agent',
            })
            results.append(result)
        return json.dumps({'saved': len(results), 'segments': results})
    except Exception as e:
        return f'{{"error": "{str(e)}"}}'


def create_segment_generator_agent(llm: LLM) -> Agent:
    return Agent(
        role="AI Segmentation Engine",
        goal=(
            "Analyze customer data distributions and produce 5–8 high-value audience "
            "segments with precise, executable MongoDB filter rules. Save them via "
            "the save_segments tool and return only the raw JSON array."
        ),
        backstory=(
            "You are an AI segmentation specialist for D2C brands. You read LTV "
            "distributions, purchase patterns, recency, and demographics and you "
            "translate them into segments operators can act on: VIP (top-LTV), "
            "at-risk (high LTV but lapsing), new-customer nurturing, cross-category "
            "buyers, win-back, and high-potential first-time buyers.\n\n"
            "OPERATING RULES:\n"
            "- ALWAYS call fetch_customer_distributions FIRST. Never invent "
            "distribution data.\n"
            "- Anchor every threshold in the actual distribution buckets you "
            "received (e.g. 'top 10% of LTV' becomes a concrete ₹ threshold).\n"
            "- Use only these fields: ltv, totalOrders, last_order_days, city, "
            "gender, age, tags, category.\n"
            "- Use only these operators: gt, gte, lt, lte, eq (numeric), contains "
            "(text).\n"
            "- Default to logic='AND'. Only use 'OR' when the segment is naturally "
            "disjunctive.\n"
            "- Every segment name is short and descriptive (e.g. 'At-Risk High-"
            "Value', not 'Segment 3').\n"
            "- After designing the segments, call save_segments with the JSON "
            "array.\n\n"
            "OUTPUT DISCIPLINE:\n"
            "- Final answer is ONLY the raw JSON array of segments. No markdown, "
            "no code fences, no prose."
        ),
        llm=llm,
        tools=[fetch_customer_distributions, save_segments_tool],
        verbose=False,
        allow_delegation=False,
        max_iter=10,
    )
