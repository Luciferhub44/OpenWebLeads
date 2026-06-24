import time
import threading

# ponytail: in-memory rate limiter, per-domain. Upgrade to Redis-based if running multiple workers.
_locks: dict[str, float] = {}
_lock = threading.Lock()

DEFAULT_DELAY_SECONDS = 2.0


def wait_for_domain(domain: str, delay: float = DEFAULT_DELAY_SECONDS):
    with _lock:
        last = _locks.get(domain, 0)
        now = time.monotonic()
        wait = max(0, delay - (now - last))
        if wait > 0:
            time.sleep(wait)
        _locks[domain] = time.monotonic()
