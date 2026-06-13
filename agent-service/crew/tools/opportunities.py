from crewai.tools import tool
from .http import get_http_tool, add_pending, record_tool_call, record_tool_result, _safe_summary


@tool("list_opportunities")
def list_opportunities(status: str = "active", limit: int = 10) -> str:
    """List AI-discovered marketing opportunities. status: active, dismissed, converted."""
    http = get_http_tool()
    if not http:
        return 'Error: backend not initialized'
    params = {'status': status, 'limit': min(limit or 10, 50)}
    record_tool_call('list_opportunities', params)
    try:
        data = http.get('/api/opportunities', params=params)
        record_tool_result('list_opportunities', data)
        return _safe_summary('opportunities', data)
    except Exception as e:
        return f'Error: {e}'


@tool("dismiss_opportunity")
def dismiss_opportunity(id: str) -> str:
    """Propose dismissing an opportunity (marks as dismissed). Requires user approval."""
    add_pending('dismiss_opportunity', {'id': id}, f"Dismiss opportunity {id}")
    return f"Pending user approval: dismiss opportunity {id}."


@tool("generate_campaign_from_opportunity")
def generate_campaign_from_opportunity(id: str) -> str:
    """Propose generating a campaign proposal from an opportunity. Requires user approval."""
    add_pending('generate_campaign_from_opportunity', {'id': id}, f"Generate proposal from opportunity {id}")
    return f"Pending user approval: generate campaign from opportunity {id}."
