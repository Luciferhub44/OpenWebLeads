#!/usr/bin/env python3
"""OpenEnrich OS — One-step setup wizard (TUI)."""
import os
import secrets
import shutil
import subprocess
import sys

# ANSI colors
G = "\033[92m"  # green
Y = "\033[93m"  # yellow
C = "\033[96m"  # cyan
R = "\033[91m"  # red
B = "\033[1m"   # bold
D = "\033[0m"   # reset

PROVIDERS = {
    "1": ("openai", "OpenAI", "gpt-4o-mini", "https://platform.openai.com/api-keys"),
    "2": ("anthropic", "Anthropic", "claude-sonnet-4-20250514", "https://console.anthropic.com/settings/keys"),
    "3": ("gemini", "Google Gemini", "gemini-2.0-flash", "https://aistudio.google.com/apikey"),
    "4": ("grok", "Grok (xAI)", "grok-3-mini", "https://console.x.ai/"),
    "5": ("mistral", "Mistral", "mistral-small-latest", "https://console.mistral.ai/api-keys"),
    "6": ("groq", "Groq", "llama-3.1-70b-versatile", "https://console.groq.com/keys"),
    "7": ("deepseek", "DeepSeek", "deepseek-chat", "https://platform.deepseek.com/api_keys"),
}


def banner():
    print(f"""
{G}{B}╔══════════════════════════════════════════════════╗
║          OpenEnrich OS — Setup Wizard            ║
║     Open-source B2B Lead Enrichment Engine       ║
╚══════════════════════════════════════════════════╝{D}
""")


def ask(prompt, default="", secret=False):
    suffix = f" [{default}]" if default and not secret else ""
    try:
        val = input(f"  {C}▸{D} {prompt}{suffix}: ").strip()
    except (EOFError, KeyboardInterrupt):
        print(f"\n{Y}Setup cancelled.{D}")
        sys.exit(0)
    return val or default


def step(n, msg):
    print(f"\n{G}{B}[{n}]{D} {B}{msg}{D}")


def check_docker():
    if not shutil.which("docker"):
        print(f"\n  {R}✗ Docker not found.{D} Install from https://docs.docker.com/get-docker/")
        print(f"  {Y}You can still configure .env now and run later.{D}")
        return False
    result = subprocess.run(["docker", "info"], capture_output=True)
    if result.returncode != 0:
        print(f"\n  {R}✗ Docker is installed but not running.{D} Start Docker Desktop first.")
        return False
    print(f"  {G}✓ Docker is running{D}")
    return True


def main():
    banner()

    # Step 1: Check prerequisites
    step(1, "Checking prerequisites")
    docker_ok = check_docker()

    # Step 2: Encryption key
    step(2, "Encryption Master Key")
    master_key = ""
    use_encryption = ask("Enable vault encryption? (recommended) [Y/n]", "Y").lower()
    if use_encryption in ("y", "yes", ""):
        master_key = secrets.token_hex(32)
        print(f"  {G}✓ Generated AES-256 encryption key{D}")
    else:
        print(f"  {Y}⚠ Vault will store keys base64-encoded (not encrypted){D}")

    # Step 3: LLM Provider
    step(3, "LLM Provider Setup")
    print()
    for k, (slug, name, model, url) in PROVIDERS.items():
        print(f"    {C}{k}{D}. {name:<16} ({model})")
    print(f"    {C}s{D}. Skip — configure later")
    print()

    choice = ask("Choose your LLM provider", "1")
    provider = ""
    api_key = ""
    model = ""

    if choice.lower() != "s" and choice in PROVIDERS:
        slug, name, model, url = PROVIDERS[choice]
        provider = slug
        print(f"\n  Get your API key at: {C}{url}{D}")
        api_key = ask(f"{name} API key (or press Enter to skip)", secret=True)
        if api_key:
            print(f"  {G}✓ {name} key configured{D}")
        else:
            print(f"  {Y}⚠ No key entered — set DEFAULT_LLM_API_KEY in .env later{D}")
            provider = slug
    elif choice.lower() == "s":
        print(f"  {Y}⚠ Skipped — set DEFAULT_LLM_API_KEY in .env when ready{D}")
        provider = "openai"
        model = "gpt-4o-mini"

    # Step 4: Optional config
    step(4, "Optional Configuration")

    proxy_urls = ask("Proxy URLs (comma-separated, or Enter to skip)", "")
    webhook_url = ask("Webhook URL for job notifications (or Enter to skip)", "")

    # Step 5: Write .env
    step(5, "Writing configuration")

    env_content = f"""DATABASE_URL=postgresql://openenrich:openenrich@postgres:5432/openenrich
REDIS_URL=redis://redis:6379/0
ENCRYPTION_MASTER_KEY={master_key}
DEFAULT_LLM_PROVIDER={provider}
DEFAULT_LLM_API_KEY={api_key}
DEFAULT_LLM_MODEL={model}
PROXY_URLS={proxy_urls}
WEBHOOK_URL={webhook_url}
"""

    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")

    if os.path.exists(env_path):
        overwrite = ask(".env already exists. Overwrite? [y/N]", "N").lower()
        if overwrite not in ("y", "yes"):
            print(f"  {Y}⚠ Keeping existing .env{D}")
        else:
            with open(env_path, "w") as f:
                f.write(env_content)
            print(f"  {G}✓ .env written{D}")
    else:
        with open(env_path, "w") as f:
            f.write(env_content)
        print(f"  {G}✓ .env written{D}")

    # Step 6: Launch
    if docker_ok:
        step(6, "Launching OpenEnrich OS")
        launch = ask("Start all services now? [Y/n]", "Y").lower()
        if launch in ("y", "yes", ""):
            print(f"\n  {C}Starting docker compose...{D}\n")
            os.system("docker compose up --build -d")
            print(f"\n  {C}Running database migrations...{D}")
            os.system("docker compose exec web alembic upgrade head")
            print(f"""
{G}{B}╔══════════════════════════════════════════════════╗
║           OpenEnrich OS is running!              ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  API:       http://localhost:8000                ║
║  Dashboard: http://localhost:3000                ║
║  Docs:      http://localhost:8000/docs           ║
║                                                  ║
║  Next: Register your first admin user:           ║
║  curl -X POST http://localhost:8000/api/v1/      ║
║       auth/register -H 'Content-Type:            ║
║       application/json' -d                       ║
║       '{{"email":"you@co.com","password":"pw"}}'   ║
║                                                  ║
╚══════════════════════════════════════════════════╝{D}
""")
        else:
            _print_manual_instructions()
    else:
        _print_manual_instructions()


def _print_manual_instructions():
    print(f"""
{G}{B}╔══════════════════════════════════════════════════╗
║         Configuration complete!                  ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  To start:                                       ║
║    docker compose up --build -d                  ║
║    docker compose exec web alembic upgrade head  ║
║                                                  ║
║  Then open:                                      ║
║    API:       http://localhost:8000               ║
║    Dashboard: http://localhost:3000               ║
║    Docs:      http://localhost:8000/docs          ║
║                                                  ║
╚══════════════════════════════════════════════════╝{D}
""")


if __name__ == "__main__":
    main()
