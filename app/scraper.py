import random
from urllib.parse import urlparse

from app.config import settings
from app.ratelimit import wait_for_domain


def _get_proxy() -> dict | None:
    urls = [u.strip() for u in settings.PROXY_URLS.split(",") if u.strip()]
    if not urls:
        return None
    return {"server": random.choice(urls)}


def scrape_url(url: str, timeout_ms: int = 30000) -> str:
    from playwright.sync_api import sync_playwright

    domain = urlparse(url).netloc or url
    wait_for_domain(domain)

    proxy = _get_proxy()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, proxy=proxy)
        page = browser.new_page()
        page.goto(url, wait_until="networkidle", timeout=timeout_ms)
        html = page.content()
        browser.close()
    return html
