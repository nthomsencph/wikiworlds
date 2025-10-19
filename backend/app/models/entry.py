"""Entry models with temporal support and custom field definitions.

Entries are the core content units in a World. They support:
- Hierarchical organization (tree structure using ltree)
- Custom field definitions per entry type
- Temporal validity (when entries exist in the world timeline)
- Temporal field values (properties that change over time)
"""

from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlmodel import JSON, Column, Field, Index, SQLModel, UniqueConstraint


class EntryType(SQLModel, table=True):
    """Defines types of entries with custom fields.

    Examples: Character, Location, Item, Organization, Event, Concept
    Users can create their own types and define custom fields for each.

    Supports hierarchical organization:
    - Top-level categories: General, Places, People, Concepts
    - Subcategories: e.g., Places > Regions, Places > Locations
    """

    __tablename__ = "entry_type"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    world_id: UUID = Field(foreign_key="world.id", index=True)

    # Hierarchy - entry types can be organized in a tree
    parent_id: UUID | None = Field(
        default=None, foreign_key="entry_type.id", index=True
    )

    # Core fields
    name: str  # Always plural: "Characters", "Locations", "Places"
    slug: str

    # System vs user-defined
    is_system: bool = False  # Built-in types vs custom types

    # Template
    default_title: str = "Untitled"
    title_property: str | None = None  # Which field to use as title

    # Settings
    settings: dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    # Example: {
    #   "show_on_timeline": true,
    #   "default_icon": "🏰",
    #   "allow_children": true,
    # }

    # Metadata
    created_by: UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: datetime | None = None

    __table_args__ = (
        UniqueConstraint("world_id", "slug"),
        Index("idx_entry_type_world", "world_id"),
        Index("idx_entry_type_parent", "parent_id"),
    )


class FieldDefinition(SQLModel, table=True):
    """Custom field definitions for entry types.

    Defines the schema for custom properties on entries.
    Examples: "Race" (text), "Level" (number), "Alignment" (select)
    """

    __tablename__ = "field_definition"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    entry_type_id: UUID = Field(foreign_key="entry_type.id", index=True)

    # Core fields
    name: str
    slug: str
    description: str | None = None

    # Field type
    field_type: str
    # Supported types:
    # - text, long_text, number, checkbox, date
    # - select, multi_select
    # - reference (to another entry), multi_reference
    # - url, email, phone
    # - timeline_date (temporal support)
    # - json (arbitrary structured data)

    # Configuration
    config: dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    # Example configs by type:
    # select: {"options": [{"value": "good", "label": "Good", "color": "green"}]}
    # number: {"min": 0, "max": 100, "step": 1}
    # reference: {"target_entry_types": ["character"], "allow_multiple": false}
    # timeline_date: {"allow_ranges": true, "show_time": false}

    # Validation
    is_required: bool = False
    default_value: Any | None = Field(default=None, sa_column=Column(JSON))

    # Display
    show_in_table: bool = True
    show_in_preview: bool = False

    # Temporal support
    is_temporal: bool = (
        False  # If true, this field can have different values at different times
    )

    # Ordering
    position: int = 0

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("entry_type_id", "slug"),
        Index("idx_field_def_type", "entry_type_id"),
    )


class Entry(SQLModel, table=True):
    """Core content entry with hierarchical structure and temporal validity.

    Entries are organized in a tree using PostgreSQL ltree extension.
    Each entry exists during a specific time period in the world timeline.
    """

    __tablename__ = "entry"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Tenancy
    world_id: UUID = Field(foreign_key="world.id", index=True)
    entry_type_id: UUID = Field(foreign_key="entry_type.id", index=True)

    # Hierarchy - using ltree for efficient tree queries
    # Path format: "root.regions.faerun.waterdeep"
    # Use UUIDs in path to avoid name conflicts: "uuid1.uuid2.uuid3"
    path: str = Field(index=True)
    # Note: Requires ltree extension in PostgreSQL

    # Core fields
    title: str
    slug: str

    # Display
    icon: str | None = None
    cover_image: str | None = None

    # --- TEMPORAL VALIDITY ---
    # When does this entry exist in the world timeline?
    timeline_start_year: int | None = None  # Null = ancient/unknown beginning
    timeline_start_month: int | None = None
    timeline_start_day: int | None = None

    timeline_end_year: int | None = None  # Null = ongoing/current
    timeline_end_month: int | None = None
    timeline_end_day: int | None = None

    # Temporal metadata
    timeline_is_circa: bool = False  # Approximate dates
    timeline_is_ongoing: bool = False  # Still exists in current timeline
    timeline_display_override: str | None = None  # Custom display for dates

    # Position among siblings (fractional indexing for efficient reordering)
    position: float = 0.0

    # Search optimization
    search_vector: str | None = None  # tsvector for full-text search
    # Note: Requires proper index: CREATE INDEX idx_entry_search ON entry USING GIN(search_vector)

    # Future: Semantic search
    embedding: list[float] | None = Field(default=None, sa_column=Column(JSON))

    # Metadata
    created_by: UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: UUID = Field(foreign_key="user.id")
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Soft delete
    deleted_at: datetime | None = None

    __table_args__ = (
        UniqueConstraint("world_id", "slug"),
        Index("idx_entry_world", "world_id"),
        Index("idx_entry_type", "entry_type_id"),
        Index("idx_entry_path", "path"),  # Will use gist index via migration
        Index("idx_entry_timeline_start", "timeline_start_year"),
        Index("idx_entry_timeline_end", "timeline_end_year"),
    )

    def contains_timeline_year(self, year: int) -> bool:
        """Check if this entry exists during a given year."""
        if self.timeline_start_year is not None and year < self.timeline_start_year:
            return False
        if self.timeline_end_year is not None and year > self.timeline_end_year:
            return False
        return True


class FieldValue(SQLModel, table=True):
    """Values for custom fields on entries.

    Supports temporal field values - a field can have different values
    at different points in the timeline.

    Example: A kingdom's "Ruler" field changes over time:
    - Year 100-150: King Arthur
    - Year 150-200: King Mordred
    """

    __tablename__ = "field_value"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    entry_id: UUID = Field(foreign_key="entry.id", index=True)
    field_definition_id: UUID = Field(foreign_key="field_definition.id", index=True)

    # The actual value (stored as JSON for flexibility)
    value: dict[str, Any] = Field(sa_column=Column(JSON))
    # Value structure depends on field_type:
    # - text: {"text": "Arthur Pendragon"}
    # - number: {"number": 42}
    # - select: {"value": "good", "label": "Good"}
    # - reference: {"entry_id": "uuid", "title": "Camelot"}
    # - timeline_date: {"start_year": 100, "end_year": 150, ...}

    # --- TEMPORAL VALIDITY ---
    # When is this value valid in the timeline?
    # Only used if field_definition.is_temporal is True
    timeline_start_year: int | None = None
    timeline_start_month: int | None = None
    timeline_start_day: int | None = None

    timeline_end_year: int | None = None
    timeline_end_month: int | None = None
    timeline_end_day: int | None = None

    # Temporal metadata
    timeline_is_circa: bool = False
    timeline_is_ongoing: bool = False

    # Metadata
    created_by: UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: UUID = Field(foreign_key="user.id")
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    __table_args__ = (
        Index("idx_field_value_entry", "entry_id"),
        Index("idx_field_value_field", "field_definition_id"),
        Index("idx_field_value_timeline_start", "timeline_start_year"),
        Index("idx_field_value_timeline_end", "timeline_end_year"),
        # Composite index for temporal queries
        Index(
            "idx_field_value_temporal",
            "entry_id",
            "field_definition_id",
            "timeline_start_year",
            "timeline_end_year",
        ),
    )

    def is_valid_at_year(self, year: int) -> bool:
        """Check if this field value is valid at a given year."""
        if self.timeline_start_year is not None and year < self.timeline_start_year:
            return False
        if self.timeline_end_year is not None and year > self.timeline_end_year:
            return False
        return True


# Re-export for convenience
__all__ = [
    "EntryType",
    "FieldDefinition",
    "Entry",
    "FieldValue",
]
