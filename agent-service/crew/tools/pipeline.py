from crewai.tools import tool
from .http import get_http_tool, record_tool_call, record_tool_result, _safe_summary


@tool("get_pipeline_status")
def get_pipeline_status() -> str:
    """Get real-time pipeline status: queue depth, worker health, active campaigns."""
    http = get_http_tool()
    if not http:
        return 'Error: backend not initialized'
    record_tool_call('get_pipeline_status', {})
    try:
        data = http.get('/api/pipeline/status')
        record_tool_result('get_pipeline_status', data)
        return _safe_summary('pipeline', data)
    except Exception as e:
        return f'Error: {e}'
