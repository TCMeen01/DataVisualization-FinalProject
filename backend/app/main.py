import asyncio
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import ai, ai_stream, data, execute, gallery, insights, logs
from app.config import settings
from app.services import data_store
from app.services.logger import init_db

# Fix for Windows: asyncio subprocess requires ProactorEventLoop
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.SANDBOX_DIR.mkdir(parents=True, exist_ok=True)
    await init_db()
    data_store.load()
    yield


app = FastAPI(title="VN Data Viz AI", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(ai_stream.router, tags=["ai-stream"])
app.include_router(execute.router, prefix="/api/execute", tags=["execute"])
app.include_router(logs.router, prefix="/api/logs", tags=["logs"])
app.include_router(data.router, prefix="/api/data", tags=["data"])
app.include_router(gallery.router, prefix="/api/gallery", tags=["gallery"])
app.include_router(insights.router)


@app.get("/health")
async def health() -> dict:
    return {"ok": True}
