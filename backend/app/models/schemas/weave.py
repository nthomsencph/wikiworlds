"""Pydantic schemas for Weave API requests and responses."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


# --- Weave Schemas ---


class WeaveBase(BaseModel):
    """Base schema for Weave."""

    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    description: str | None = None
    icon: str | None = None
    color: str | None = None


class WeaveCreate(WeaveBase):
    """Schema for creating a new Weave."""

    subscription_tier: str = "free"


class WeaveUpdate(BaseModel):
    """Schema for updating a Weave."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    icon: str | None = None
    color: str | None = None
    settings: dict[str, Any] | None = None


class WeavePublic(WeaveBase):
    """Public schema for Weave responses."""

    id: UUID
    subscription_tier: str
    subscription_status: str
    created_at: datetime
    updated_at: datetime

    # User's role in this weave (populated separately)
    user_role: str | None = None


class WeavesPublic(BaseModel):
    """Schema for paginated list of Weaves."""

    data: list[WeavePublic]
    count: int


# --- WeaveUser Schemas ---


class WeaveUserBase(BaseModel):
    """Base schema for WeaveUser."""

    user_id: UUID
    role: str = Field(..., pattern=r"^(owner|admin|member)$")


class WeaveUserCreate(WeaveUserBase):
    """Schema for adding a user to a Weave."""

    pass


class WeaveUserUpdate(BaseModel):
    """Schema for updating a user's role in a Weave."""

    role: str = Field(..., pattern=r"^(owner|admin|member)$")


class WeaveUserPublic(WeaveUserBase):
    """Public schema for WeaveUser responses."""

    id: UUID
    weave_id: UUID
    status: str
    joined_at: datetime

    # User details (populated via join)
    user_email: str | None = None
    user_full_name: str | None = None
