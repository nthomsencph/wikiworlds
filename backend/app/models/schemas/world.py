"""Pydantic schemas for World API requests and responses."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


# --- World Schemas ---


class WorldBase(BaseModel):
    """Base schema for World."""

    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    description: str | None = None
    icon: str | None = None
    cover_image: str | None = None
    color: str | None = None


class WorldCreate(WorldBase):
    """Schema for creating a new World."""

    is_public: bool = False
    is_template: bool = False


class WorldUpdate(BaseModel):
    """Schema for updating a World."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    icon: str | None = None
    cover_image: str | None = None
    color: str | None = None
    is_public: bool | None = None
    settings: dict[str, Any] | None = None


class WorldPublic(WorldBase):
    """Public schema for World responses."""

    id: UUID
    weave_id: UUID
    is_public: bool
    is_template: bool
    created_at: datetime
    updated_at: datetime

    # User's role in this world (populated separately)
    user_role: str | None = None


class WorldsPublic(BaseModel):
    """Schema for paginated list of Worlds."""

    data: list[WorldPublic]
    count: int


# --- WorldUser Schemas ---


class WorldUserBase(BaseModel):
    """Base schema for WorldUser."""

    user_id: UUID
    role: str = Field(..., pattern=r"^(admin|editor|commenter|viewer)$")


class WorldUserCreate(WorldUserBase):
    """Schema for adding a user to a World."""

    pass


class WorldUserUpdate(BaseModel):
    """Schema for updating a user's role in a World."""

    role: str = Field(..., pattern=r"^(admin|editor|commenter|viewer)$")


class WorldUserPublic(WorldUserBase):
    """Public schema for WorldUser responses."""

    id: UUID
    world_id: UUID
    status: str
    joined_at: datetime

    # User details (populated via join)
    user_email: str | None = None
    user_full_name: str | None = None
