from crewai.tools import tool
from .http import get_http_tool, add_pending, record_tool_call, record_tool_result, _safe_summary


@tool("list_ab_tests")
def list_ab_tests() -> str:
    """List all A/B tests."""
    http = get_http_tool()
    if not http:
        return 'Error: backend not initialized'
    record_tool_call('list_ab_tests', {})
    try:
        data = http.get('/api/ab-tests')
        record_tool_result('list_ab_tests', data)
        return _safe_summary('ab_tests', data)
    except Exception as e:
        return f'Error: {e}'


@tool("get_ab_test")
def get_ab_test(id: str) -> str:
    """Fetch a single A/B test by Mongo _id with variant performance."""
    http = get_http_tool()
    if not http:
        return 'Error: backend not initialized'
    record_tool_call('get_ab_test', {'id': id})
    try:
        data = http.get(f'/api/ab-tests/{id}')
        record_tool_result('get_ab_test', data)
        return _safe_summary('ab_test', data)
    except Exception as e:
        return f'Error: {e}'


@tool("create_ab_test")
def create_ab_test(name: str, segmentId: str = "", channel: str = "whatsapp",
                   variantA: str = "", variantB: str = "") -> str:
    """Propose creating a new A/B test with two message variants. Requires user approval."""
    body = {
        'name': name, 'segmentId': segmentId, 'channel': channel,
        'variantA': {'messageTemplate': variantA},
        'variantB': {'messageTemplate': variantB},
    }
    add_pending('create_ab_test', body, f"Create A/B test '{name}'")
    return f"Pending user approval: create A/B test '{name}'."


@tool("set_ab_test_winner")
def set_ab_test_winner(id: str, winner: str) -> str:
    """Propose declaring a winning variant for an A/B test (winner: 'A' or 'B'). Requires user approval."""
    add_pending('set_ab_test_winner', {'id': id, 'winner': winner}, f"Set A/B test {id} winner to {winner}")
    return f"Pending user approval: set A/B test {id} winner to {winner}."
