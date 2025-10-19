"""Pydantic schemas for Entry and FieldValue API requests and responses."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

# --- Entry Schemas ---


class EntryBase(BaseModel):
    """Base schema for Entry."""

    title: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    icon: str | None = None
    cover_image: str | None = None


class EntryCreate(EntryBase):
    """Schema for creating a new Entry."""

    entry_type_id: UUID
    parent_id: UUID | None = None

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

    # Tags (tag names, will be created if they don't exist)
    tags: list[str] = []


class EntryUpdate(BaseModel):
    """Schema for updating an Entry."""

    title: str | None = Field(None, min_length=1, max_length=255)
    icon: str | None = None
    cover_image: str | None = None

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


class EntryMove(BaseModel):
    """Schema for moving an entry to a new parent."""

    new_parent_id: UUID | None = Field(
        None,
        description="UUID of the new parent entry (null for root)",
    )


class EntryPublic(EntryBase):
    """Public schema for Entry responses."""

    id: UUID
    world_id: UUID
    entry_type_id: UUID
    path: str

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

    position: float
    created_at: datetime
    updated_at: datetime

    # Optional expanded data (populated separately)
    entry_type_name: str | None = None
    parent_id: UUID | None = None
    children_count: int | None = None
    character_count: int | None = None
    tags: list[str] = []  # List of tag names


class EntryWithFields(EntryPublic):
    """Entry with field values included."""

    field_values: dict[UUID, Any] = {}  # Map of field_definition_id to value


class EntriesPublic(BaseModel):
    """Schema for paginated list of Entries."""

    data: list[EntryPublic]
    count: int


class EntryTree(EntryPublic):
    """Entry with children for tree view."""

    children: list["EntryTree"] = []


# --- FieldValue Schemas ---


class FieldValueBase(BaseModel):
    """Base schema for FieldValue."""

    value: dict[str, Any]


class FieldValueCreate(FieldValueBase):
    """Schema for creating a new FieldValue."""

    field_definition_id: UUID

    # Temporal validity
    timeline_start_year: int | None = None
    timeline_start_month: int | None = None
    timeline_start_day: int | None = None

    timeline_end_year: int | None = None
    timeline_end_month: int | None = None
    timeline_end_day: int | None = None

    timeline_is_circa: bool = False
    timeline_is_ongoing: bool = False


class FieldValueUpdate(BaseModel):
    """Schema for updating a FieldValue."""

    value: dict[str, Any]

    # Temporal validity
    timeline_start_year: int | None = None
    timeline_start_month: int | None = None
    timeline_start_day: int | None = None

    timeline_end_year: int | None = None
    timeline_end_month: int | None = None
    timeline_end_day: int | None = None

    timeline_is_circa: bool | None = None
    timeline_is_ongoing: bool | None = None


class FieldValuePublic(FieldValueBase):
    """Public schema for FieldValue responses."""

    id: UUID
    entry_id: UUID
    field_definition_id: UUID

    # Temporal validity
    timeline_start_year: int | None
    timeline_start_month: int | None
    timeline_start_day: int | None
    timeline_end_year: int | None
    timeline_end_month: int | None
    timeline_end_day: int | None
    timeline_is_circa: bool
    timeline_is_ongoing: bool

    created_at: datetime
    updated_at: datetime

    # Optional expanded data
    field_name: str | None = None
    field_type: str | None = None


class FieldValuesPublic(BaseModel):
    """Schema for list of FieldValues."""

    data: list[FieldValuePublic]
    count: int


class BulkFieldValues(BaseModel):
    """Schema for setting multiple field values at once."""

    field_values: list[FieldValueCreate]
