from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.routers import audio_router, annotation_router, dict_router, auth_router, review_router, export_router, project_router, webhook_router
from app.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(audio_router, prefix=settings.API_V1_STR)
app.include_router(annotation_router, prefix=settings.API_V1_STR)
app.include_router(dict_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(review_router, prefix=settings.API_V1_STR)
app.include_router(export_router, prefix=settings.API_V1_STR)
app.include_router(project_router, prefix=settings.API_V1_STR)
app.include_router(webhook_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "ANAS API", "version": "0.1.0"}

@app.get("/health")
def health():
    return {"status": "ok"}
