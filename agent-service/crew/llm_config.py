import os
from crewai import LLM


def _fetch_settings():
    """Try to fetch user settings from the backend API."""
    try:
        from crew.tools.http import get_http_tool
        http = get_http_tool()
        if http:
            return http.get('/api/settings')
    except Exception:
        pass
    return None


def get_llm():
    settings = _fetch_settings()
    config_source = (settings or {}).get('configSource', 'env')

    if config_source == 'manual':
        base_url = (settings or {}).get('openaiBaseUrl', '').strip()
        api_key = (settings or {}).get('openaiApiKey', '').strip()
        ai_model = (settings or {}).get('aiModel', 'default')
        custom_model = (settings or {}).get('customModel', '').strip()

        if ai_model == 'custom' and custom_model:
            model = custom_model
        elif ai_model and ai_model != 'default':
            model = ai_model
        else:
            model = os.getenv('CUSTOM_LLM_MODEL', '')

        if not base_url:
            base_url = os.getenv('CUSTOM_LLM_BASE_URL', '')
        if not api_key:
            api_key = os.getenv('CUSTOM_LLM_API_KEY', '')
    else:
        model = os.getenv('CUSTOM_LLM_MODEL')
        base_url = os.getenv('CUSTOM_LLM_BASE_URL')
        api_key = os.getenv('CUSTOM_LLM_API_KEY')

    if not all([model, base_url, api_key]):
        raise ValueError(
            "Missing required LLM config: model, base_url, api_key. "
            "Set via Settings UI (Manual Configuration) or environment variables "
            "CUSTOM_LLM_MODEL, CUSTOM_LLM_BASE_URL, CUSTOM_LLM_API_KEY."
        )

    return LLM(
        model=f"openai/{model}",
        base_url=base_url,
        api_key=api_key,
        temperature=0.3,
        max_tokens=4000,
    )
