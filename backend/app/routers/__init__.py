from app.routers.audio import router as audio_router
from app.routers.annotation import router as annotation_router
from app.routers.dict import router as dict_router

__all__ = ["audio_router", "annotation_router", "dict_router"]
