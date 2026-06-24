import os
import pytest


def test_encrypt_decrypt_roundtrip(monkeypatch):
    import secrets
    monkeypatch.setenv("ENCRYPTION_MASTER_KEY", secrets.token_hex(32))

    # Re-import to pick up the env var
    from importlib import reload
    import app.config
    reload(app.config)
    import app.vault
    reload(app.vault)

    from app.vault import encrypt, decrypt
    plaintext = "sk-test-key-12345"
    blob = encrypt(plaintext)
    assert decrypt(blob) == plaintext


def test_decrypt_fails_with_wrong_key(monkeypatch):
    import secrets
    key1 = secrets.token_hex(32)
    key2 = secrets.token_hex(32)

    monkeypatch.setenv("ENCRYPTION_MASTER_KEY", key1)
    from importlib import reload
    import app.config
    reload(app.config)
    import app.vault
    reload(app.vault)

    from app.vault import encrypt, decrypt
    blob = encrypt("secret")

    monkeypatch.setenv("ENCRYPTION_MASTER_KEY", key2)
    reload(app.config)
    reload(app.vault)

    from app.vault import decrypt as decrypt2
    with pytest.raises(Exception):
        decrypt2(blob)
