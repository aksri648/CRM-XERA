from crewai.tools import tool
from .http import get_http_tool, add_pending, record_tool_call, record_tool_result, _safe_summary


@tool("list_campaigns")
def list_campaigns(status: str = "", limit: int = 20, sort: str = "-createdAt") -> str:
    """List campaigns. Optional status filter: draft, running, stopped, completed."""
    http = get_http_tool()
    if not http:
        return 'Error: backend not initialized'
    params = {'limit': min(limit or 20, 100), 'sort': sort}
    if status:
        params['status'] = status
    record_tool_call('list_campaigns', params)
    try:
        data = http.get('/api/campaigns', params=params)
        record_tool_result('list_campaigns', data)
        return _safe_summary('campaigns', data)
    except Exception as e:
        return f'Error: {e}'


@tool("get_campaign")
def get_campaign(id: str) -> str:
    """Fetch a single campaign by Mongo _id, including segment and message template."""
    http = get_http_tool()
    if not http:
        return 'Error: backend not initialized'
    record_tool_call('get_campaign', {'id': id})
    try:
        data = http.get(f'/api/campaigns/{id}')
        record_tool_result('get_campaign', data)
        return _safe_summary('campaign', data)
    except Exception as e:
        return f'Error: {e}'


@tool("get_campaign_stats")
def get_campaign_stats(id: str) -> str:
    """Fetch live performance stats for a campaign: sent, delivered, opened, clicked, converted, revenue."""
    http = get_http_tool()
    if not http:
        return 'Error: backend not initialized'
    record_tool_call('get_campaign_stats', {'id': id})
    try:
        data = http.get(f'/api/campaigns/{id}/stats')
        record_tool_result('get_campaign_stats', data)
        return _safe_summary('stats', data)
    except Exception as e:
        return f'Error: {e}'


@tool("create_campaign")
def create_campaign(name: str, segmentId: str = "", channel: str = "whatsapp", messageTemplate: str = "") -> str:
    """Propose creating a new draft campaign. channel: whatsapp, sms, email, rcs. Requires user approval."""
    params = {'name': name, 'segmentId': segmentId, 'channel': channel, 'messageTemplate': messageTemplate}
    add_pending('create_campaign', params, f"Create campaign '{name}' on {channel}")
    return f"Pending user approval: create campaign '{name}' on {channel}."


@tool("update_campaign")
def update_campaign(id: str, name: str = "", channel: str = "", messageTemplate: str = "") -> str:
    """Propose updating an existing campaign. Only provided fields are changed. Requires user approval."""
    patch = {}
    if name:
        patch['name'] = name
    if channel:
        patch['channel'] = channel
    if messageTemplate:
        patch['messageTemplate'] = messageTemplate
    add_pending('update_campaign', {'id': id, 'patch': patch}, f"Update campaign {id}")
    return f"Pending user approval: update campaign {id}."


@tool("launch_campaign")
def launch_campaign(id: str) -> str:
    """Propose launching a draft campaign — sends messages to the target segment. Requires user approval."""
    add_pending('launch_campaign', {'id': id}, f"Launch campaign {id}")
    return f"Pending user approval: launch campaign {id}."


@tool("stop_campaign")
def stop_campaign(id: str) -> str:
    """Propose stopping a running campaign. Requires user approval."""
    add_pending('stop_campaign', {'id': id}, f"Stop campaign {id}")
    return f"Pending user approval: stop campaign {id}."


@tool("delete_campaign")
def delete_campaign(id: str) -> str:
    """Propose deleting a campaign permanently. Requires user approval."""
    add_pending('delete_campaign', {'id': id}, f"Delete campaign {id}")
    return f"Pending user approval: delete campaign {id}."
