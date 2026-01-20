from .base import *  # noqa

DEBUG = True

ALLOWED_HOSTS = ["127.0.0.1", "localhost"]

# =========================
# DEV: Swagger available
# =========================

# =========================
# DEV: Relax CSP for Swagger UI
# =========================
CONTENT_SECURITY_POLICY["DIRECTIVES"]["script-src"] += (
    "'unsafe-inline'",
    "https://cdn.jsdelivr.net",
)

CONTENT_SECURITY_POLICY["DIRECTIVES"]["style-src"] += (
    "'unsafe-inline'",
    "https://cdn.jsdelivr.net",
)

CONTENT_SECURITY_POLICY["DIRECTIVES"]["img-src"] += (
    "https://cdn.jsdelivr.net",
)

CONTENT_SECURITY_POLICY["DIRECTIVES"]["connect-src"] += (
    "https://cdn.jsdelivr.net",
)

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",    
]
CORS_ALLOW_CREDENTIALS = True
