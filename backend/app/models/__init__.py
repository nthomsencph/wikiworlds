"""
Models package for the FastAPI application.

This package contains all SQLModel models organized by domain:
- base: Shared models and utilities (Message, Token, etc.)
- user: User authentication and management models
- item: Item models (placeholder, will be replaced with AIMA-specific models)
"""

# Import all models to make them available when importing from models
from .base import Message, NewPassword, Token, TokenPayload
from .item import Item, ItemBase, ItemCreate, ItemPublic, ItemsPublic, ItemUpdate
from .user import (
    UpdatePassword,
    User,
    UserBase,
    UserCreate,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)

# Export all models for easy importing
__all__ = [
    # Base models
    "Message",
    "Token",
    "TokenPayload",
    "NewPassword",
    # User models
    "User",
    "UserBase",
    "UserCreate",
    "UserRegister",
    "UserUpdate",
    "UserUpdateMe",
    "UpdatePassword",
    "UserPublic",
    "UsersPublic",
    # Item models
    "Item",
    "ItemBase",
    "ItemCreate",
    "ItemUpdate",
    "ItemPublic",
    "ItemsPublic",
]
