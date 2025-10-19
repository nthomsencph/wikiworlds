"""Weave (tenant) and World models."""

from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlmodel import JSON, Column, Field, Index, SQLModel, UniqueConstraint


class Weave(SQLModel, table=True):
    """Top-level tenant - like a Notion workspace.

    A Weave contains multiple Worlds and has its own members with roles.
    This is where subscription/billing would be tied.
    """

    __tablename__ = "weave"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Core fields
    name: str = Field(max_length=255)
    slug: str = Field(max_length=100, unique=True, index=True)
    description: str | None = None

    # Display
    icon: str | None = None
    color: str | None = None

    # Subscription
    subscription_tier: str = "free"  # 'free', 'pro', 'enterprise'
    subscription_status: str = "active"  # 'active', 'trialing', 'past_due', 'canceled'

    # Settings
    settings: dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    # Example settings: {"default_permissions": {...}, "sso_enabled": false, ...}

    # Ownership
    created_by: UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Soft delete
    deleted_at: datetime | None = None


class WeaveUser(SQLModel, table=True):
    """Membership and roles within a Weave.

    Defines who has access to this Weave and what they can do.
    """

    __tablename__ = "weave_user"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    weave_id: UUID = Field(foreign_key="weave.id", index=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)

    # Role-based access
    role: str  # 'owner', 'admin', 'member'
    # owner: full control, can delete weave
    # admin: manage worlds, invite users
    # member: access to assigned worlds

    # Status
    status: str = "active"  # 'active', 'invited', 'suspended'
    invited_by: UUID | None = Field(foreign_key="user.id")
    invited_at: datetime | None = None
    joined_at: datetime = Field(default_factory=datetime.utcnow)

    # Custom permissions (overrides)
    custom_permissions: dict[str, Any] = Field(default={}, sa_column=Column(JSON))

    __table_args__ = (
        UniqueConstraint("weave_id", "user_id"),
        Index("idx_weave_user_weave", "weave_id"),
        Index("idx_weave_user_user", "user_id"),
    )


class World(SQLModel, table=True):
    """A world/universe within a Weave.

    This is the main container for worldbuilding content. Think of it like
    a separate campaign, novel universe, or game world.
    """

    __tablename__ = "world"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Tenancy
    weave_id: UUID = Field(foreign_key="weave.id", index=True)

    # Core fields
    name: str = Field(max_length=255)
    slug: str = Field(max_length=100)
    description: str | None = None

    # Display
    icon: str | None = None
    cover_image: str | None = None
    color: str | None = None

    # Visibility
    is_public: bool = False  # Public worlds can be viewed by anyone
    is_template: bool = False  # Template worlds can be copied by others

    # Settings
    settings: dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    # Example: {
    #   "enable_timeline": true,
    #   "enable_map": true,
    #   "default_entry_type": "page",
    #   "custom_css": "...",
    # }

    # Metadata
    created_by: UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: UUID = Field(foreign_key="user.id")
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Soft delete
    deleted_at: datetime | None = None

    __table_args__ = (
        UniqueConstraint("weave_id", "slug"),
        Index("idx_world_weave", "weave_id"),
        Index("idx_world_public", "is_public"),
    )


class WorldUser(SQLModel, table=True):
    """Membership and permissions within a specific World.

    Users can have different roles in different Worlds within the same Weave.
    """

    __tablename__ = "world_user"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    world_id: UUID = Field(foreign_key="world.id", index=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)

    # Role-based access
    role: str  # 'admin', 'editor', 'commenter', 'viewer'
    # admin: full control of world, manage users
    # editor: create/edit entries
    # commenter: can comment on entries
    # viewer: read-only access

    # Status
    status: str = "active"  # 'active', 'invited', 'suspended'
    invited_by: UUID | None = Field(foreign_key="user.id")
    invited_at: datetime | None = None
    joined_at: datetime = Field(default_factory=datetime.utcnow)

    # Custom permissions
    custom_permissions: dict[str, Any] = Field(default={}, sa_column=Column(JSON))

    __table_args__ = (
        UniqueConstraint("world_id", "user_id"),
        Index("idx_world_user_world", "world_id"),
        Index("idx_world_user_user", "user_id"),
    )


# Re-export for convenience
__all__ = [
    "Weave",
    "WeaveUser",
    "World",
    "WorldUser",
]
