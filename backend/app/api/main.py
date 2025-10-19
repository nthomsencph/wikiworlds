from fastapi import APIRouter

from app.api.routes import (
    blocks,
    entries,
    entry_types,
    items,
    login,
    private,
    tags,
    users,
    utils,
    weaves,
    worlds,
)
from app.config import settings

api_router = APIRouter()

# Authentication and user management
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)

# Legacy items (will be replaced by worldbuilding entries)
api_router.include_router(items.router)

# Worldbuilding routes
api_router.include_router(weaves.router, prefix="/weaves", tags=["weaves"])
api_router.include_router(
    worlds.router,
    prefix="/weaves/{weave_id}/worlds",
    tags=["worlds"],
)
api_router.include_router(
    entry_types.router,
    prefix="/weaves/{weave_id}/worlds/{world_id}/entry-types",
    tags=["entry-types"],
)
api_router.include_router(
    entries.router,
    prefix="/weaves/{weave_id}/worlds/{world_id}/entries",
    tags=["entries"],
)
api_router.include_router(
    blocks.router,
    prefix="/weaves/{weave_id}/worlds/{world_id}/blocks",
    tags=["blocks"],
)
api_router.include_router(
    tags.router,
    prefix="/weaves/{weave_id}/worlds/{world_id}/tags",
    tags=["tags"],
)

if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
