from crewai.tools import tool
from .http import get_http_tool, add_pending, record_tool_call, record_tool_result, _safe_summary


@tool("list_proposals")
def list_proposals(status: str = "", limit: int = 20) -> str:
    """List agent-generated campaign proposals. status: pending, approved, rejected."""
    http = get_http_tool()
    if not http:
        return 'Error: backend not initialized'
    params = {'limit': min(limit or 20, 100)}
    if status:
        params['status'] = status
    record_tool_call('list_proposals', params)
    try:
        data = http.get('/api/proposals', params=params)
        record_tool_result('list_proposals', data)
        return _safe_summary('proposals', data)
    except Exception as e:
        return f'Error: {e}'


@tool("get_proposal")
def get_proposal(id: str) -> str:
    """Fetch a single agent proposal by Mongo _id."""
    http = get_http_tool()
    if not http:
        return 'Error: backend not initialized'
    record_tool_call('get_proposal', {'id': id})
    try:
        data = http.get(f'/api/proposals/{id}')
        record_tool_result('get_proposal', data)
        return _safe_summary('proposal', data)
    except Exception as e:
        return f'Error: {e}'


@tool("approve_proposal")
def approve_proposal(id: str) -> str:
    """Propose approving an agent proposal — this also creates and launches the underlying campaign. Requires user approval."""
    add_pending('approve_proposal', {'id': id}, f"Approve proposal {id}")
    return f"Pending user approval: approve proposal {id}."


@tool("reject_proposal")
def reject_proposal(id: str) -> str:
    """Propose rejecting an agent proposal. Requires user approval."""
    add_pending('reject_proposal', {'id': id}, f"Reject proposal {id}")
    return f"Pending user approval: reject proposal {id}."


@tool("update_proposal")
def update_proposal(id: str, title: str = "", channel: str = "", messageTemplate: str = "") -> str:
    """Propose updating a proposal's fields before approval. Requires user approval."""
    patch = {}
    if title:
        patch['title'] = title
    if channel:
        patch['channel'] = channel
    if messageTemplate:
        patch['messageTemplate'] = messageTemplate
    add_pending('update_proposal', {'id': id, 'patch': patch}, f"Update proposal {id}")
    return f"Pending user approval: update proposal {id}."
