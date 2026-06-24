import os
import secrets
import pytest
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _encrypt(plaintext: str, key_hex: str) -> bytes:
    nonce = os.urandom(12)
    cipher = AESGCM(bytes.fromhex(key_hex))
    ct = cipher.encrypt(nonce, plaintext.encode(), None)
    return nonce + ct


def _decrypt(blob: bytes, key_hex: str) -> str:
    cipher = AESGCM(bytes.fromhex(key_hex))
    nonce, ct = blob[:12], blob[12:]
    return cipher.decrypt(nonce, ct, None).decode()


def test_encrypt_decrypt_roundtrip():
    key = secrets.token_hex(32)
    plaintext = "sk-test-key-12345"
    blob = _encrypt(plaintext, key)
    assert _decrypt(blob, key) == plaintext


def test_decrypt_fails_with_wrong_key():
    key1 = secrets.token_hex(32)
    key2 = secrets.token_hex(32)
    blob = _encrypt("secret", key1)
    with pytest.raises(Exception):
        _decrypt(blob, key2)


def test_different_plaintexts_different_ciphertexts():
    key = secrets.token_hex(32)
    b1 = _encrypt("key-a", key)
    b2 = _encrypt("key-b", key)
    assert b1 != b2


def test_nonce_is_12_bytes():
    key = secrets.token_hex(32)
    blob = _encrypt("test", key)
    assert len(blob) > 12  # nonce + ciphertext + tag
