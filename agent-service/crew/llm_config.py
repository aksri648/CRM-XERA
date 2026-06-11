import os
from crewai import LLM


def get_llm():
    model = os.getenv('CUSTOM_LLM_MODEL')
    base_url = os.getenv('CUSTOM_LLM_BASE_URL')
    api_key = os.getenv('CUSTOM_LLM_API_KEY')

    if not all([model, base_url, api_key]):
        raise ValueError(
            "Missing required environment variables: "
            "CUSTOM_LLM_MODEL, CUSTOM_LLM_BASE_URL, CUSTOM_LLM_API_KEY"
        )

    return LLM(
        model=f"openai/{model}",
        base_url=base_url,
        api_key=api_key,
        temperature=0.3,
        max_tokens=2000,
    )
