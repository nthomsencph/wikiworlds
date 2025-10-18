"""Pydantic schemas for EntryType and FieldDefinition API requests and responses."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


# --- EntryType Schemas ---


class EntryTypeBase(BaseModel):
    """Base schema for EntryType."""

    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")


class EntryTypeCreate(EntryTypeBase):
    """Schema for creating a new EntryType."""

    parent_id: UUID | None = None
    default_title: str = "Untitled"
    title_property: str | None = None
    settings: dict[str, Any] = {}


class EntryTypeUpdate(BaseModel):
    """Schema for updating an EntryType."""

    name: str | None = Field(None, min_length=1, max_length=255)
    parent_id: UUID | None = None
    default_title: str | None = None
    title_property: str | None = None
    settings: dict[str, Any] | None = None


class EntryTypePublic(EntryTypeBase):
    """Public schema for EntryType responses."""

    id: UUID
    world_id: UUID
    parent_id: UUID | None
    default_title: str
    title_property: str | None
    is_system: bool
    settings: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class EntryTypesPublic(BaseModel):
    """Schema for paginated list of EntryTypes."""

    data: list[EntryTypePublic]
    count: int


# --- FieldDefinition Schemas ---


class FieldDefinitionBase(BaseModel):
    """Base schema for FieldDefinition."""

    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    description: str | None = None
    field_type: str = Field(
        ...,
        pattern=r"^(text|long_text|number|checkbox|date|select|multi_select|reference|multi_reference|url|email|phone|timeline_date|json)$",
    )
    config: dict[str, Any] = {}


class FieldDefinitionCreate(FieldDefinitionBase):
    """Schema for creating a new FieldDefinition."""

    is_required: bool = False
    default_value: Any = None
    show_in_table: bool = True
    show_in_preview: bool = False
    is_temporal: bool = False
    position: int | None = None


class FieldDefinitionUpdate(BaseModel):
    """Schema for updating a FieldDefinition."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    config: dict[str, Any] | None = None
    is_required: bool | None = None
    default_value: Any = None
    show_in_table: bool | None = None
    show_in_preview: bool | None = None
    is_temporal: bool | None = None
    position: int | None = None


class FieldDefinitionPublic(FieldDefinitionBase):
    """Public schema for FieldDefinition responses."""

    id: UUID
    entry_type_id: UUID
    is_required: bool
    default_value: Any
    show_in_table: bool
    show_in_preview: bool
    is_temporal: bool
    position: int
    created_at: datetime
    updated_at: datetime


class FieldDefinitionsPublic(BaseModel):
    """Schema for list of FieldDefinitions."""

    data: list[FieldDefinitionPublic]
    count: int


class FieldReorderRequest(BaseModel):
    """Schema for reordering fields."""

    field_positions: dict[UUID, int] = Field(
        ...,
        description="Map of field_id to new position",
    )
