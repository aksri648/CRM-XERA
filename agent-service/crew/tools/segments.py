from crewai.tools import tool
from .http import get_http_tool, add_pending, record_tool_call, record_tool_result, _safe_summary


@tool("list_segments")
def list_segments() -> str:
    """List all customer segments with their filter rules and customer counts."""
    http = get_http_tool()
    if not http:
        return 'Error: backend not initialized'
    record_tool_call('list_segments', {})
    try:
        data = http.get('/api/segments')
        record_tool_result('list_segments', data)
        return _safe_summary('segments', data)
    except Exception as e:
        return f'Error: {e}'


@tool("get_segment")
def get_segment(id: str) -> str:
    """Fetch a single segment by Mongo _id with its rules."""
    http = get_http_tool()
    if not http:
        return 'Error: backend not initialized'
    record_tool_call('get_segment', {'id': id})
    try:
        data = http.get(f'/api/segments/{id}')
        record_tool_result('get_segment', data)
        return _safe_summary('segment', data)
    except Exception as e:
        return f'Error: {e}'


@tool("get_segment_customers")
def get_segment_customers(id: str, page: int = 1, limit: int = 20) -> str:
    """List customers matching a segment's rules. Paginated."""
    http = get_http_tool()
    if not http:
        return 'Error: backend not initialized'
    params = {'page': page, 'limit': min(limit or 20, 100)}
    record_tool_call('get_segment_customers', {'id': id, **params})
    try:
        data = http.get(f'/api/segments/{id}/customers', params=params)
        record_tool_result('get_segment_customers', data)
        return _safe_summary('segment_customers', data)
    except Exception as e:
        return f'Error: {e}'


@tool("preview_segment")
def preview_segment(filterRules: str, logic: str = "AND") -> str:
    """Preview how many customers match a set of filter rules without persisting a segment.
    filterRules is a JSON string array of {field, operator, value} objects. logic is AND or OR.
    Example filterRules: '[{"field":"ltv","operator":"gt","value":10000}]'"""
    http = get_http_tool()
    if not http:
        return 'Error: backend not initialized'
    import json
    try:
        rules = json.loads(filterRules) if isinstance(filterRules, str) else filterRules
    except Exception as e:
        return f'Error: filterRules is not valid JSON: {e}'
    record_tool_call('preview_segment', {'filterRules': rules, 'logic': logic})
    try:
        data = http.post('/api/segments/preview', body={'filterRules': rules, 'logic': logic})
        record_tool_result('preview_segment', data)
        return _safe_summary('preview', data)
    except Exception as e:
        return f'Error: {e}'


@tool("create_segment")
def create_segment(name: str, filterRules: str, logic: str = "AND", description: str = "") -> str:
    """Propose creating a new segment. filterRules is a JSON string array of {field, operator, value}. Requires user approval."""
    import json
    try:
        rules = json.loads(filterRules) if isinstance(filterRules, str) else filterRules
    except Exception as e:
        return f'Error: filterRules is not valid JSON: {e}'
    body = {'name': name, 'filterRules': rules, 'logic': logic, 'description': description}
    add_pending('create_segment', body, f"Create segment '{name}'")
    return f"Pending user approval: create segment '{name}'."


@tool("delete_segment")
def delete_segment(id: str) -> str:
    """Propose deleting a segment by Mongo _id. Requires user approval."""
    add_pending('delete_segment', {'id': id}, f"Delete segment {id}")
    return f"Pending user approval: delete segment {id}."
