import json
import httpx


class HttpFetchTool:
    def __init__(self, base_url: str, token: str = ""):
        self.base_url = base_url.rstrip('/')
        self.token = token
        self._client = None

    @property
    def client(self):
        if self._client is None:
            headers = {'Content-Type': 'application/json'}
            if self.token:
                headers['Authorization'] = f'Bearer {self.token}'
            self._client = httpx.Client(base_url=self.base_url, headers=headers, timeout=20.0)
        return self._client

    def get(self, path: str, params: dict = None) -> dict:
        resp = self.client.get(path, params={k: v for k, v in (params or {}).items() if v not in (None, "")})
        resp.raise_for_status()
        return resp.json()

    def post(self, path: str, body: dict = None) -> dict:
        resp = self.client.post(path, json=body or {})
        resp.raise_for_status()
        return resp.json() if resp.content else {}


_http_fetch_tool: HttpFetchTool | None = None
pending_actions: list[dict] = []
tool_events: list[dict] = []


def set_http_tool(base_url: str, token: str = ""):
    global _http_fetch_tool
    _http_fetch_tool = HttpFetchTool(base_url, token)


def get_http_tool() -> HttpFetchTool | None:
    return _http_fetch_tool


def clear_pending():
    pending_actions.clear()


def add_pending(tool: str, params: dict, description: str = ""):
    pending_actions.append({'tool': tool, 'params': params, 'description': description or tool})


def clear_events():
    tool_events.clear()


def record_tool_call(tool: str, params: dict):
    tool_events.append({'type': 'tool_call', 'tool': tool, 'params': params})


def record_tool_result(tool: str, data):
    tool_events.append({'type': 'tool_result', 'tool': tool, 'data': data})


def _safe_summary(label: str, data, max_items: int = 8) -> str:
    """Produce a short LLM-facing string summary; full data is sent to the UI via record_tool_result."""
    try:
        return json.dumps(data, default=str)[:4000]
    except Exception:
        return f"{label}: <unserializable>"
