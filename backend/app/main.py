from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes.listings import router as listings_router
from app.api.routes.wishlist import router as wishlist_router
from app.api.routes.bookings import router as bookings_router
from app.api.routes.reviews import router as reviews_router
from app.api.routes.host import router as host_router
from app.api.routes.auth import router as auth_router
from app.routers.chat import router as chat_router

app = FastAPI(title="Airbnb Marketplace API")

# Allow all origins for CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Rate Limiting Hint / Middleware placeholder:
# For production hardening, attach a token-bucket or sliding-window rate limiter
# (e.g. using `slowapi` or Redis-backed `aioredis` rate limiter):
#
# from slowapi import Limiter, _rate_limit_exceeded_handler
# from slowapi.util import get_remote_address
# from slowapi.errors import RateLimitExceeded
# limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
# app.state.limiter = limiter
# app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
# ============================================================================

app.include_router(listings_router)
app.include_router(wishlist_router)
app.include_router(bookings_router)
app.include_router(reviews_router)
app.include_router(host_router)
app.include_router(auth_router)
app.include_router(chat_router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "ok"}
