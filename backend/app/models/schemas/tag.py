"""Pydantic schemas for Tag API requests and responses."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

# --- Tag Schemas ---


class TagBase(BaseModel):
    """Base schema for Tag."""

    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    color: str = Field("#6B7280", pattern=r"^#[0-9A-Fa-f]{6}$")
    icon: str | None = None
    description: str | None = None
    tag_group: str | None = None


class TagCreate(TagBase):
    """Schema for creating a new Tag."""

    pass


class TagUpdate(BaseModel):
    """Schema for updating a Tag."""

    name: str | None = Field(None, min_length=1, max_length=255)
    color: str | None = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    icon: str | None = None
    description: str | None = None
    tag_group: str | None = None


class TagPublic(TagBase):
    """Public schema for Tag responses."""

    id: UUID
    world_id: UUID
    created_at: datetime


class TagsPublic(BaseModel):
    """Schema for paginated list of Tags."""

    data: list[TagPublic]
    count: int
