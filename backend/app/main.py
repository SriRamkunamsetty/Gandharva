from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from typing import Dict, Tuple
from app.core.config import settings
from app.api import audio, auth
import time
from loguru import logger
import sys

# Configure Loguru
logger.remove()
logger.add(sys.stdout, colorize=True, format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
)

# CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Error Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "code": "INTERNAL_SERVER_ERROR"},
    )

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response

# Routes will be included here
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(audio.router, prefix=f"{settings.API_V1_STR}/audio", tags=["audio"])

# Basic In-Memory Rate Limiting (IP-based)
rate_limit_records: Dict[str, Tuple[int, float]] = {}
RATE_LIMIT_REQUESTS = 50
RATE_LIMIT_WINDOW_SECS = 60

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Exclude health check from rate limits to prevent monitoring alerts
    if request.url.path.endswith("/health"):
        return await call_next(request)
        
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    
    req_count, window_start = rate_limit_records.get(client_ip, (0, now))
    
    if now - window_start > RATE_LIMIT_WINDOW_SECS:
        req_count = 0
        window_start = now
        
    if req_count >= RATE_LIMIT_REQUESTS:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"error": "Too Many Requests", "code": "RATE_LIMIT_EXCEEDED"},
            headers={"Retry-After": str(int(RATE_LIMIT_WINDOW_SECS - (now - window_start)))}
        )
        
    rate_limit_records[client_ip] = (req_count + 1, window_start)
    return await call_next(request)

@app.middleware("http")
async def timeout_middleware(request: Request, call_next):
    try:
        return await asyncio.wait_for(call_next(request), timeout=30.0)
    except asyncio.TimeoutError:
        return JSONResponse(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            content={"error": "Request timeout (30s limit)", "code": "GATEWAY_TIMEOUT"}
        )

from sqlalchemy.sql import text
from app.db.session import SessionLocal

@app.get("/api/v1/health")
def health_check():
    health_status = {
        "status": "ok",
        "app": settings.PROJECT_NAME,
        "db": "down",
        "redis": "down",
        "worker": "down"
    }
    
    # Check DB
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        health_status["db"] = "up"
    except Exception:
        pass
    finally:
        db.close()
        
    # Check Redis & Worker (mocked check for now, can be expanded)
    try:
        import redis
        r = redis.from_url("redis://localhost:6379/0")
        if r.ping():
            health_status["redis"] = "up"
            # In a real scenario, use celery inspect to ping workers
            health_status["worker"] = "up" # Mocking worker status as up if redis is up and accepting tasks
    except Exception:
        pass
        
    if "down" in health_status.values():
        health_status["status"] = "degraded"
        
    return health_status
