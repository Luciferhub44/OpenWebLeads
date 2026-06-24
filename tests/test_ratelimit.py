import time
from app.ratelimit import wait_for_domain


def test_first_call_no_wait():
    start = time.monotonic()
    wait_for_domain("test-instant.com", delay=1.0)
    elapsed = time.monotonic() - start
    assert elapsed < 0.1


def test_second_call_waits():
    wait_for_domain("test-ratelimit.com", delay=0.2)
    start = time.monotonic()
    wait_for_domain("test-ratelimit.com", delay=0.2)
    elapsed = time.monotonic() - start
    assert elapsed >= 0.15  # should wait ~0.2s


def test_different_domains_no_wait():
    wait_for_domain("domain-a.com", delay=1.0)
    start = time.monotonic()
    wait_for_domain("domain-b.com", delay=1.0)
    elapsed = time.monotonic() - start
    assert elapsed < 0.1
