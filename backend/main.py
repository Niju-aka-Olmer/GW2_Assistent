import asyncio
import logging
import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.requests import Request
import uvicorn

from api.endpoints import router
from api.gw2_client import preload_item_name_cache

logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="GW2 Assistant API",
    description="Backend for GW2 Assistant — proxy to GW2 API and DeepSeek AI",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_deepseek_requests(request: Request, call_next):
    if "/deepseek/analyze-build" in request.url.path or "/deepseek/analyze-inventory" in request.url.path or "/deepseek/analyze-trading-post" in request.url.path:
        body = await request.body()
        logger.info(f"=== DEEPSEEK REQUEST BODY === {body}")
    response = await call_next(request)
    return response


app.include_router(router)


@app.on_event("startup")
async def startup():
    logger.info("Starting background item name cache preload...")
    asyncio.create_task(preload_item_name_cache())


@app.on_event("startup")
async def detect_ip():
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        logger.info(f"=== Server available at http://{local_ip}:8000 ===")
    except Exception:
        logger.info("=== Server available at http://localhost:8000 ===")


FRONTEND_DIR: Path | None = None
if getattr(sys, 'frozen', False):
    _base = Path(sys.executable).parent
    _candidates = [
        _base / "frontend",
        _base / "dist" / "frontend",
        _base.parent / "frontend",
    ]
else:
    _base = Path(__file__).resolve().parent.parent
    _candidates = [
        _base / "frontend" / "dist",
        _base / "frontend",
    ]

for _p in _candidates:
    if (_p / "index.html").exists():
        FRONTEND_DIR = _p.resolve()
        break

if FRONTEND_DIR:
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
    logger.info(f"Frontend static files mounted from: {FRONTEND_DIR}")
else:
    logger.warning("Frontend dist directory not found. Run 'npm run build' in frontend/")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
