"""
Database package for the FastAPI application.

This package contains:
- database: Database engine, session management, and initialization
- crud: All CRUD operations organized by domain
"""

# Import database utilities
# Import all CRUD operations for backward compatibility
from .crud import (
    # User CRUD
    authenticate,
    # Item CRUD
    create_item,
    create_user,
    delete_item,
    delete_user,
    get_item_by_id,
    get_items,
    get_items_by_owner,
    get_user_by_email,
    get_user_by_id,
    get_users,
    is_active,
    is_superuser,
    update_item,
    update_user,
)
from .database import engine, get_session, init_db

# Export everything for easy importing
__all__ = [
    # Database utilities
    "engine",
    "get_session",
    "init_db",
    # User CRUD
    "authenticate",
    "create_user",
    "delete_user",
    "get_user_by_email",
    "get_user_by_id",
    "get_users",
    "is_active",
    "is_superuser",
    "update_user",
    # Item CRUD
    "create_item",
    "delete_item",
    "get_item_by_id",
    "get_items",
    "get_items_by_owner",
    "update_item",
]
