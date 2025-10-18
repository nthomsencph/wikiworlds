"""
CRUD operations package.

This package contains all database CRUD (Create, Read, Update, Delete) operations
organized by domain/entity type.
"""

# Import all CRUD operations for easy access
from .item import (
    create_item,
    delete_item,
    get_item_by_id,
    get_items,
    get_items_by_owner,
    update_item,
)
from .user import (
    authenticate,
    create_user,
    delete_user,
    get_user_by_email,
    get_user_by_id,
    get_users,
    is_active,
    is_superuser,
    update_user,
)

# Export all CRUD functions
__all__ = [
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
