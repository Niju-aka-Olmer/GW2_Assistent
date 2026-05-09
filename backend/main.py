import asyncio
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request

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
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.1.180:3000",
    ],
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


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
