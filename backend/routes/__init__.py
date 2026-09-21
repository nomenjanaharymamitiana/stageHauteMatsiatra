from .auth import router as auth_router
from .document import router as document_router

__all__ = ["auth_router", "document_router"]