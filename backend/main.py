import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.endpoints import router
from api.gw2_client import preload_item_name_cache

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

app.include_router(router)


@app.on_event("startup")
async def startup():
    asyncio.create_task(preload_item_name_cache())


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
