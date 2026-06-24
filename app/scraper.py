import random

from playwright.sync_api import sync_playwright

from app.config import settings


def _get_proxy() -> dict | None:
    urls = [u.strip() for u in settings.PROXY_URLS.split(",") if u.strip()]
    if not urls:
        return None
    url = random.choice(urls)
    return {"server": url}


def scrape_url(url: str, timeout_ms: int = 30000) -> str:
    proxy = _get_proxy()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, proxy=proxy)
        page = browser.new_page()
        page.goto(url, wait_until="networkidle", timeout=timeout_ms)
        html = page.content()
        browser.close()
    return html
