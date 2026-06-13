from crewai.tools import tool
from .http import get_http_tool, record_tool_call, record_tool_result, _safe_summary


@tool("get_analytics_overview")
def get_analytics_overview() -> str:
    """Get the high-level analytics overview: totals, revenue, conversion rates."""
    http = get_http_tool()
    if not http:
        return 'Error: backend not initialized'
    record_tool_call('get_analytics_overview', {})
    try:
        data = http.get('/api/analytics/overview')
        record_tool_result('get_analytics_overview', data)
        return _safe_summary('overview', data)
    except Exception as e:
        return f'Error: {e}'


@tool("get_channels_analytics")
def get_channels_analytics() -> str:
    """Get per-channel (whatsapp/email/sms/rcs) performance metrics."""
    http = get_http_tool()
    if not http:
        return 'Error: backend not initialized'
    record_tool_call('get_channels_analytics', {})
    try:
        data = http.get('/api/analytics/channels')
        record_tool_result('get_channels_analytics', data)
        return _safe_summary('channels', data)
    except Exception as e:
        return f'Error: {e}'


@tool("get_top_campaigns")
def get_top_campaigns() -> str:
    """Get the top-performing campaigns by revenue or conversion."""
    http = get_http_tool()
    if not http:
        return 'Error: backend not initialized'
    record_tool_call('get_top_campaigns', {})
    try:
        data = http.get('/api/analytics/campaigns/top')
        record_tool_result('get_top_campaigns', data)
        return _safe_summary('top_campaigns', data)
    except Exception as e:
        return f'Error: {e}'


@tool("get_funnel")
def get_funnel() -> str:
    """Get the full marketing funnel: sent → delivered → opened → clicked → converted."""
    http = get_http_tool()
    if not http:
        return 'Error: backend not initialized'
    record_tool_call('get_funnel', {})
    try:
        data = http.get('/api/analytics/funnel')
        record_tool_result('get_funnel', data)
        return _safe_summary('funnel', data)
    except Exception as e:
        return f'Error: {e}'
