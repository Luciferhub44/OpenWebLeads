import pytest
from app.llm import PROVIDERS, DEFAULT_MODELS, call_llm


def test_all_providers_have_default_model():
    for provider in PROVIDERS:
        assert provider in DEFAULT_MODELS, f"{provider} missing from DEFAULT_MODELS"


def test_unknown_provider_raises():
    with pytest.raises(ValueError, match="Unknown provider"):
        call_llm("nonexistent", "key", "sys", "user")


def test_provider_configs_have_required_keys():
    for name, cfg in PROVIDERS.items():
        assert "base_url" in cfg, f"{name} missing base_url"
        assert "format" in cfg, f"{name} missing format"
        assert cfg["format"] in ("openai", "anthropic"), f"{name} has unknown format"
