from crewai.tools import tool
from .http import get_http_tool, add_pending, record_tool_call, record_tool_result, _safe_summary


@tool("get_settings")
def get_settings() -> str:
    """Get the current platform settings (timezone, currency, AI model, schedules)."""
    http = get_http_tool()
    if not http:
        return 'Error: backend not initialized'
    record_tool_call('get_settings', {})
    try:
        data = http.get('/api/settings')
        record_tool_result('get_settings', data)
        return _safe_summary('settings', data)
    except Exception as e:
        return f'Error: {e}'


@tool("update_settings")
def update_settings(platformName: str = "", timezone: str = "", currency: str = "",
                    aiModel: str = "", scanSchedule: str = "", autoApprove: bool = None) -> str:
    """Propose updating platform settings. Only provided fields are changed. Requires user approval."""
    patch = {}
    if platformName:
        patch['platformName'] = platformName
    if timezone:
        patch['timezone'] = timezone
    if currency:
        patch['currency'] = currency
    if aiModel:
        patch['aiModel'] = aiModel
    if scanSchedule:
        patch['scanSchedule'] = scanSchedule
    if autoApprove is not None:
        patch['autoApprove'] = autoApprove
    if not patch:
        return 'Error: no fields to update.'
    add_pending('update_settings', patch, f"Update settings: {', '.join(patch.keys())}")
    return f"Pending user approval: update settings ({', '.join(patch.keys())})."
