from app.routers.audio import router as audio_router
from app.routers.annotation import router as annotation_router
from app.routers.dict import router as dict_router
from app.routers.auth import router as auth_router
from app.routers.review import router as review_router
from app.routers.export import router as export_router
from app.routers.project import router as project_router

__all__ = ["audio_router", "annotation_router", "dict_router", "auth_router", "review_router", "export_router", "project_router"]
