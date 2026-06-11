import os
import httpx
from crewai import Agent, LLM
from crewai.tools import tool


class HttpFetchTool:
    """Makes an authenticated HTTP GET request to the Xeno backend."""

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
                timeout=15.0,
            )
        return self._client

    def get(self, path: str, params: dict = None) -> dict:
        resp = self.client.get(path, params=params)
        resp.raise_for_status()
        return resp.json()


_http_fetch_tool = None

def set_http_tool(base_url: str, token: str):
    global _http_fetch_tool
    _http_fetch_tool = HttpFetchTool(base_url, token)


@tool("fetch_customers")
def fetch_customers_query(query: str = "", sort: str = "ltv", limit: int = 10) -> str:
    """Fetch customer records from the CRM. Returns top customers by LTV, search by name/email, or filter by tag."""
    if _http_fetch_tool is None:
        return '{"error": "Not initialized"}'
    try:
        data = _http_fetch_tool.get('/api/customers', params={'search': query, 'sort': sort, 'limit': limit})
        customers = data.get('customers', [])
        total = data.get('total', 0)
        if not customers:
            return f"No customers found matching '{query}'."
        lines = [f"Total: {total} customers. Top {len(customers)} by {sort}:"]
        for c in customers:
            lines.append(f"- {c.get('name','?')} | {c.get('email','?')} | LTV: ₹{c.get('ltv',0)} | Orders: {c.get('totalOrders',0)}")
        return '\n'.join(lines)
    except Exception as e:
        return f'{{"error": "{str(e)}"}}'


@tool("fetch_campaigns")
def fetch_campaigns_query(limit: int = 10, status: str = "") -> str:
    """Fetch marketing campaigns. Optionally filter by status (draft/running/completed)."""
    if _http_fetch_tool is None:
        return '{"error": "Not initialized"}'
    try:
        params = {'limit': limit}
        if status:
            params['status'] = status
        data = _http_fetch_tool.get('/api/campaigns', params=params)
        campaigns = data.get('campaigns', []) if isinstance(data, dict) else data
        if not campaigns:
            return "No campaigns found."
        lines = [f"Found {len(campaigns)} campaign(s):"]
        for c in campaigns:
            lines.append(f"- {c.get('name','?')} | {c.get('channel','?')} | {c.get('status','?')} | Sent: {c.get('stats',{}).get('sent',0)}")
        return '\n'.join(lines)
    except Exception as e:
        return f'{{"error": "{str(e)}"}}'


@tool("fetch_segments")
def fetch_segments_query() -> str:
    """Fetch all customer segments."""
    if _http_fetch_tool is None:
        return '{"error": "Not initialized"}'
    try:
        data = _http_fetch_tool.get('/api/segments')
        segments = data.get('segments', []) if isinstance(data, dict) else data
        if not segments:
            return "No segments found."
        lines = [f"Found {len(segments)} segment(s):"]
        for s in segments:
            lines.append(f"- {s.get('name','?')} | {s.get('createdBy','?')} | Rules: {len(s.get('filterRules',[]))}")
        return '\n'.join(lines)
    except Exception as e:
        return f'{{"error": "{str(e)}"}}'


@tool("fetch_pipeline_status")
def fetch_pipeline_status() -> str:
    """Fetch real-time pipeline and worker status."""
    if _http_fetch_tool is None:
        return '{"error": "Not initialized"}'
    try:
        data = _http_fetch_tool.get('/api/pipeline/status')
        lines = ["System Status:"]
        for k, v in data.items():
            lines.append(f"- {k}: {v}")
        return '\n'.join(lines)
    except Exception as e:
        return f'{{"error": "{str(e)}"}}'


@tool("fetch_system_status")
def fetch_system_status() -> str:
    """Fetch agent service and campaign worker health."""
    if _http_fetch_tool is None:
        return '{"error": "Not initialized"}'
    try:
        data = _http_fetch_tool.get('/api/agent/system-status')
        lines = ["Agent / System Status:"]
        for k, v in data.items():
            lines.append(f"- {k}: {v}")
        return '\n'.join(lines)
    except Exception as e:
        return f'{{"error": "{str(e)}"}}'


@tool("fetch_opportunities")
def fetch_opportunities_query(limit: int = 5) -> str:
    """Fetch AI-discovered marketing opportunities."""
    if _http_fetch_tool is None:
        return '{"error": "Not initialized"}'
    try:
        data = _http_fetch_tool.get('/api/opportunities', params={'status': 'active', 'limit': limit})
        opps = data.get('opportunities', []) if isinstance(data, dict) else data
        if not opps:
            return "No active opportunities found."
        lines = [f"Found {len(opps)} opportunity(s):"]
        for o in opps:
            lines.append(f"- {o.get('title','?')} | Audience: {o.get('audienceDescription','?')} | Expected: ₹{o.get('expectedRevenue',0)}")
        return '\n'.join(lines)
    except Exception as e:
        return f'{{"error": "{str(e)}"}}'


def create_command_judge(llm: LLM) -> Agent:
    return Agent(
        role="Xeno CRM Command Judge",
        goal=(
            "Analyze the user's message and decide the single best action: answer from "
            "general knowledge, fetch specific data from the CRM tools, or trigger a "
            "campaign generation. Use the minimum number of tools needed. Never "
            "automatically generate a campaign unless the user explicitly asks to create "
            "one or describes a marketing goal."
        ),
        backstory=(
            "You are the central intelligence of the Xeno CRM Command Centre. You have "
            "access to live data from the CRM via tools. You respond concisely and "
            "accurately. You only trigger campaign generation when the user clearly "
            "wants a marketing campaign — not for general questions. You answer "
            "questions about CRM concepts, system status, and data with the tools "
            "available to you."
        ),
        llm=llm,
        tools=[fetch_customers_query, fetch_campaigns_query, fetch_segments_query,
               fetch_pipeline_status, fetch_system_status, fetch_opportunities_query],
        verbose=False,
        allow_delegation=False,
        max_iter=8,
    )