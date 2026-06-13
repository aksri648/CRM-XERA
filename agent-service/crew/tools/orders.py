from crewai.tools import tool
from .http import get_http_tool, record_tool_call, record_tool_result, _safe_summary


@tool("list_orders")
def list_orders(limit: int = 20) -> str:
    """List recent orders. Limit max 100."""
    http = get_http_tool()
    if not http:
        return 'Error: backend not initialized'
    params = {'limit': min(limit or 20, 100)}
    record_tool_call('list_orders', params)
    try:
        data = http.get('/api/orders', params=params)
        record_tool_result('list_orders', data)
        return _safe_summary('orders', data)
    except Exception as e:
        return f'Error: {e}'
