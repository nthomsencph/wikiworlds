"""Pydantic schemas for Block API requests and responses."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


# --- Block Schemas ---


class BlockBase(BaseModel):
    """Base schema for Block."""

    block_type: str = Field(..., min_length=1, max_length=100)
    content: dict[str, Any] = Field(default_factory=dict)


class BlockCreate(BlockBase):
    """Schema for creating a new Block."""

    parent_block_id: UUID | None = None
    position: float = 0.0

    # Temporal validity
    timeline_start_year: int | None = None
    timeline_start_month: int | None = None
    timeline_start_day: int | None = None

    timeline_end_year: int | None = None
    timeline_end_month: int | None = None
    timeline_end_day: int | None = None

    timeline_is_circa: bool = False
    timeline_is_ongoing: bool = False
    timeline_display_override: str | None = None

    # Display settings
    is_collapsed: bool = False
    background_color: str | None = None
    text_color: str | None = None


class BlockUpdate(BaseModel):
    """Schema for updating a Block."""

    block_type: str | None = Field(None, min_length=1, max_length=100)
    content: dict[str, Any] | None = None
    parent_block_id: UUID | None = None
    position: float | None = None

    # Temporal validity
    timeline_start_year: int | None = None
    timeline_start_month: int | None = None
    timeline_start_day: int | None = None

    timeline_end_year: int | None = None
    timeline_end_month: int | None = None
    timeline_end_day: int | None = None

    timeline_is_circa: bool | None = None
    timeline_is_ongoing: bool | None = None
    timeline_display_override: str | None = None

    # Display settings
    is_collapsed: bool | None = None
    background_color: str | None = None
    text_color: str | None = None


class BlockPublic(BlockBase):
    """Public schema for Block responses."""

    id: UUID
    entry_id: UUID
    parent_block_id: UUID | None
    position: float

    # Temporal validity
    timeline_start_year: int | None
    timeline_start_month: int | None
    timeline_start_day: int | None
    timeline_end_year: int | None
    timeline_end_month: int | None
    timeline_end_day: int | None
    timeline_is_circa: bool
    timeline_is_ongoing: bool
    timeline_display_override: str | None

    # Display settings
    is_collapsed: bool
    background_color: str | None
    text_color: str | None

    # Metadata
    version: int
    created_at: datetime
    updated_at: datetime


class BlocksPublic(BaseModel):
    """Schema for list of Blocks."""

    data: list[BlockPublic]
    count: int


class BulkBlocksCreate(BaseModel):
    """Schema for creating multiple blocks at once."""

    blocks: list[BlockCreate]
