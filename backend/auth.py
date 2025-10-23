# backend/auth.py
import os, requests
from functools import wraps
from typing import Any, Dict
from flask import request, g
from jose import jwt

AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")         
API_AUDIENCE = os.getenv("AUTH0_AUDIENCE")        
ALGORITHMS   = os.getenv("ALGORITHMS", "RS256").split(",")

JWKS_URL = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json" if AUTH0_DOMAIN else None
ISSUER   = f"https://{AUTH0_DOMAIN}/" if AUTH0_DOMAIN else None
HANDLE_CLAIM = "https://uic.wiki/handle"

class AuthError(Exception):
    def __init__(self, error: Dict[str, Any], status_code: int):
        super().__init__(error)
        self.error = error
        self.status_code = status_code

_jwks_cache = None
def _get_jwks():
    global _jwks_cache
    if _jwks_cache is None:
        if not JWKS_URL:
            raise AuthError({"code":"config_error","description":"AUTH0_DOMAIN not set"}, 500)
        r = requests.get(JWKS_URL, timeout=5); r.raise_for_status()
        _jwks_cache = r.json()
    return _jwks_cache

def _get_token() -> str:
    auth = request.headers.get("Authorization", "")
    parts = auth.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise AuthError({"code":"authorization_header_missing",
                         "description":"Expected 'Authorization: Bearer <token>'"}, 401)
    return parts[1]

def _verify(token: str) -> Dict[str, Any]:
    if not (AUTH0_DOMAIN and API_AUDIENCE):
        raise AuthError({"code":"config_error","description":"AUTH0 env vars not set"}, 500)
    unverified = jwt.get_unverified_header(token)
    jwks = _get_jwks()["keys"]
    rsa_key = next(({
        "kty": k["kty"], "kid": k["kid"], "use": k.get("use"),
        "n": k.get("n"), "e": k.get("e")
    } for k in jwks if k["kid"] == unverified["kid"]), None)
    if rsa_key is None:
        raise AuthError({"code":"invalid_header","description":"Appropriate key not found"}, 401)
    return jwt.decode(token, rsa_key, algorithms=ALGORITHMS, audience=API_AUDIENCE, issuer=ISSUER)

def requires_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = _get_token()
        g.current_user = _verify(token)
        return f(*args, **kwargs)
    return wrapper

def current_user():
    return getattr(g, "current_user", None)
