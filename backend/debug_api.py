import traceback
from fastapi import FastAPI
from app.api.auth import router as auth_router

app = FastAPI()
try:
    app.include_router(auth_router)
    print("Routes:", [r.path for r in app.routes])
    print("OpenAPI Paths:", list(app.openapi().get("paths", {}).keys()))
except Exception:
    traceback.print_exc()
