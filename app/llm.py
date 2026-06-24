import json

import httpx

PROVIDERS = {
    "openai": {"base_url": "https://api.openai.com/v1", "format": "openai"},
    "anthropic": {"base_url": "https://api.anthropic.com", "format": "anthropic"},
    "gemini": {"base_url": "https://generativelanguage.googleapis.com/v1beta/openai", "format": "openai"},
    "grok": {"base_url": "https://api.x.ai/v1", "format": "openai"},
    "mistral": {"base_url": "https://api.mistral.ai/v1", "format": "openai"},
    "groq": {"base_url": "https://api.groq.com/openai/v1", "format": "openai"},
    "deepseek": {"base_url": "https://api.deepseek.com/v1", "format": "openai"},
}

DEFAULT_MODELS = {
    "openai": "gpt-4o-mini",
    "anthropic": "claude-sonnet-4-20250514",
    "gemini": "gemini-2.0-flash",
    "grok": "grok-3-mini",
    "mistral": "mistral-small-latest",
    "groq": "llama-3.1-70b-versatile",
    "deepseek": "deepseek-chat",
}


def call_llm(
    provider: str,
    api_key: str,
    system_prompt: str,
    user_prompt: str,
    model: str | None = None,
    temperature: float = 0.1,
    json_mode: bool = True,
) -> dict:
    """Call any supported LLM provider. Returns {"content": str, "usage": {"input": int, "output": int}}."""
    cfg = PROVIDERS.get(provider)
    if not cfg:
        raise ValueError(f"Unknown provider: {provider}. Supported: {list(PROVIDERS.keys())}")

    model = model or DEFAULT_MODELS.get(provider, "gpt-4o-mini")

    if cfg["format"] == "anthropic":
        return _call_anthropic(cfg["base_url"], api_key, model, system_prompt, user_prompt, temperature, json_mode)
    return _call_openai_compat(cfg["base_url"], api_key, model, system_prompt, user_prompt, temperature, json_mode)


def _call_openai_compat(
    base_url: str, api_key: str, model: str,
    system_prompt: str, user_prompt: str, temperature: float, json_mode: bool,
) -> dict:
    body: dict = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": temperature,
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}

    resp = httpx.post(
        f"{base_url}/chat/completions",
        headers={"Authorization": f"Bearer {api_key}"},
        json=body,
        timeout=90.0,
    )
    resp.raise_for_status()
    data = resp.json()
    usage = data.get("usage", {})
    return {
        "content": data["choices"][0]["message"]["content"],
        "usage": {"input": usage.get("prompt_tokens", 0), "output": usage.get("completion_tokens", 0)},
    }


def _call_anthropic(
    base_url: str, api_key: str, model: str,
    system_prompt: str, user_prompt: str, temperature: float, json_mode: bool,
) -> dict:
    body: dict = {
        "model": model,
        "max_tokens": 4096,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_prompt}],
        "temperature": temperature,
    }

    resp = httpx.post(
        f"{base_url}/v1/messages",
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json=body,
        timeout=90.0,
    )
    resp.raise_for_status()
    data = resp.json()
    usage = data.get("usage", {})
    return {
        "content": data["content"][0]["text"],
        "usage": {"input": usage.get("input_tokens", 0), "output": usage.get("output_tokens", 0)},
    }
