from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.routers import audio_router, annotation_router, dict_router, auth_router, review_router, export_router, project_router, webhook_router, stats_router, user_router
from app.config import settings

def init_roles():
    """Initialize default roles if they don't exist."""
    from app.database import SessionLocal
    from app.models.user import Role, ADMIN_ROLE, ANNOTATOR_ROLE, VIEWER_ROLE
    db = SessionLocal()
    try:
        # Check each role individually
        admin_role = db.query(Role).filter(Role.name == ADMIN_ROLE).first()
        if admin_role is None:
            admin_role = Role(id="1", name=ADMIN_ROLE, description="Administrator")
            db.add(admin_role)

        annotator_role = db.query(Role).filter(Role.name == ANNOTATOR_ROLE).first()
        if annotator_role is None:
            annotator_role = Role(id="2", name=ANNOTATOR_ROLE, description="Annotator")
            db.add(annotator_role)

        viewer_role = db.query(Role).filter(Role.name == VIEWER_ROLE).first()
        if viewer_role is None:
            viewer_role = Role(id="3", name=VIEWER_ROLE, description="Viewer")
            db.add(viewer_role)

        db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    init_roles()
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
app.include_router(stats_router, prefix=settings.API_V1_STR)
app.include_router(user_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "ANAS API", "version": "0.1.0"}

@app.get("/health")
def health():
    return {"status": "ok"}
