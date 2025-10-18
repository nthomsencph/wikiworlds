"""
Models package for the worldbuilding application.

This package contains all SQLModel models organized by domain:
- base: Shared models and utilities (Message, Token, etc.)
- user: User authentication and management models
- weave: Multi-tenant Weave and World models
- timeline: Timeline and temporal support models
- entry: Entry system with custom fields and hierarchy
- block: Block-based content system
- reference: References and relationships between entries
- versioning: Version history and activity tracking
- permission: Permissions and access control
"""

# Import all models to make them available when importing from models

# Keep existing base models
from .base import Message, NewPassword, Token, TokenPayload

# Keep existing user models
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

# Keep existing item models (legacy - will be replaced by Entry system)
from .item import Item, ItemBase, ItemCreate, ItemPublic, ItemsPublic, ItemUpdate

# Worldbuilding models
from .weave import Weave, WeaveUser, World, WorldUser
from .timeline import Era, TimelineDate, WorldTimeline
from .entry import Entry, EntryType, FieldDefinition, FieldValue
from .block import Attachment, Block, BlockVersion, Comment
from .reference import EntryTag, Reference, ReferenceType, Tag
from .versioning import ActivityLog, EntryVersion, SavedView
from .permission import Permission, Team, TeamMember

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
    # Item models (legacy)
    "Item",
    "ItemBase",
    "ItemCreate",
    "ItemUpdate",
    "ItemPublic",
    "ItemsPublic",
    # Weave and World
    "Weave",
    "WeaveUser",
    "World",
    "WorldUser",
    # Timeline
    "WorldTimeline",
    "Era",
    "TimelineDate",
    # Entry system
    "Entry",
    "EntryType",
    "FieldDefinition",
    "FieldValue",
    # Block system
    "Block",
    "BlockVersion",
    "Comment",
    "Attachment",
    # References
    "Reference",
    "ReferenceType",
    "Tag",
    "EntryTag",
    # Versioning
    "EntryVersion",
    "ActivityLog",
    "SavedView",
    # Permissions
    "Permission",
    "Team",
    "TeamMember",
]
