from app.auth import hash_password


def test_hash_is_deterministic():
    h1 = hash_password("password123", "salt")
    h2 = hash_password("password123", "salt")
    assert h1 == h2


def test_different_salt_different_hash():
    h1 = hash_password("password123", "salt1")
    h2 = hash_password("password123", "salt2")
    assert h1 != h2


def test_different_password_different_hash():
    h1 = hash_password("password1", "salt")
    h2 = hash_password("password2", "salt")
    assert h1 != h2


def test_hash_is_hex():
    h = hash_password("test", "salt")
    assert all(c in "0123456789abcdef" for c in h)
    assert len(h) == 64  # SHA-256 = 32 bytes = 64 hex chars
