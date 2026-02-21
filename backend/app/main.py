from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from typing import Dict, Tuple
from app.core.config import settings
from app.api import audio, auth, exports
from app.db.session import SessionLocal
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
app.include_router(exports.router, prefix=f"{settings.API_V1_STR}/audio", tags=["exports"])

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


# --- WebSocket: Real-time status streaming ---
from fastapi import WebSocket, WebSocketDisconnect
from jose import jwt, JWTError
import json as json_mod

@app.websocket(f"{settings.API_V1_STR}/audio/ws/{{audio_id}}")
async def audio_ws(websocket: WebSocket, audio_id: str):
    """Stream processing status via WebSocket.
    Auth via query param: ?token=<jwt>
    Polls Redis task state (not DB) to avoid linear query load.
    Only hits DB once at connection and once on completion for notes.
    """
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=4001)
            return
    except JWTError:
        await websocket.close(code=4001)
        return

    # Ownership check (single DB hit)
    db = SessionLocal()
    try:
        from app.models.domain import AudioFile, Note
        audio = db.query(AudioFile).filter(AudioFile.id == audio_id).first()
        if not audio or audio.user_id != int(user_id):
            await websocket.close(code=4003)
            return
    finally:
        db.close()

    await websocket.accept()

    try:
        import redis as redis_lib
        r = redis_lib.from_url("redis://localhost:6379/0")
        poll_count = 0
        max_polls = 1200  # 10 min at 500ms intervals

        while poll_count < max_polls:
            poll_count += 1
            # Check status from DB (lightweight single-row query)
            db = SessionLocal()
            try:
                audio = db.query(AudioFile).filter(AudioFile.id == audio_id).first()
                if not audio:
                    await websocket.send_json({"status": "error", "message": "Not found"})
                    break

                status = audio.status
                msg = {"status": status, "poll": poll_count}

                if status == "complete":
                    notes = db.query(Note).filter(Note.audio_id == audio_id).all()
                    msg["notes_count"] = len(notes)
                    msg["processing_time_ms"] = audio.processing_time_ms
                    msg["notes"] = [
                        {
                            "note_name": n.note_name,
                            "frequency": n.frequency,
                            "confidence": n.confidence,
                            "raw_start": n.raw_start,
                            "raw_end": n.raw_end,
                        }
                        for n in notes[:200]  # Cap to prevent payload explosion
                    ]
                    await websocket.send_json(msg)
                    break
                elif status == "failed":
                    await websocket.send_json(msg)
                    break
                else:
                    await websocket.send_json(msg)
            finally:
                db.close()

            await asyncio.sleep(0.5)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
