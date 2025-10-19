"""Reference and relationship system with temporal support.

Allows entries to reference each other with typed, bidirectional relationships.
References can be temporal - valid only during specific time periods.

Example: "Character X ruled Kingdom Y from Year 450-490"
"""

from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlmodel import JSON, Column, Field, Index, SQLModel, UniqueConstraint


class ReferenceType(SQLModel, table=True):
    """Defines types of relationships between entries.

    Examples:
    - "rules" / "ruled by" (Character -> Location)
    - "located in" / "contains" (Location -> Location)
    - "member of" / "has member" (Character -> Organization)
    - "worships" / "worshipped by" (Character -> Deity)
    - "allied with" / "allied with" (symmetric)
    """

    __tablename__ = "reference_type"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    world_id: UUID = Field(foreign_key="world.id", index=True)

    # Names (bidirectional)
    name: str  # Forward direction: "rules", "located in"
    inverse_name: str  # Reverse direction: "ruled by", "contains"

    # Slugs for API/URL usage
    slug: str
    inverse_slug: str

    # Description
    description: str | None = None

    # Display
    icon: str | None = None
    color: str | None = None

    # Constraints - which entry types can use this reference
    source_entry_types: list[str] = Field(default=[], sa_column=Column(JSON))
    # Empty list = any type allowed
    # Example: ["character"] = only characters can be source

    target_entry_types: list[str] = Field(default=[], sa_column=Column(JSON))
    # Example: ["location"] = can only reference locations

    # Relationship properties
    is_symmetric: bool = False  # If true, inverse is identical (e.g., "allied with")
    allow_multiple: bool = True  # Can an entry have multiple of this reference?
    is_required: bool = False  # Is this reference required for the entry type?

    # System vs user-defined
    is_system: bool = False

    # Settings
    settings: dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    # Example: {
    #   "show_in_sidebar": true,
    #   "group_references": true,
    #   "default_to_temporal": false
    # }

    # Metadata
    created_by: UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: datetime | None = None

    __table_args__ = (
        UniqueConstraint("world_id", "slug"),
        Index("idx_reference_type_world", "world_id"),
    )


class Reference(SQLModel, table=True):
    """A relationship between two entries with optional temporal validity.

    Represents directed relationships that can change over time.
    """

    __tablename__ = "reference"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # What type of reference is this?
    reference_type_id: UUID = Field(foreign_key="reference_type.id", index=True)

    # Source and target entries
    source_entry_id: UUID = Field(foreign_key="entry.id", index=True)
    target_entry_id: UUID = Field(foreign_key="entry.id", index=True)

    # Optional: block-level references
    # Allows referencing specific blocks within entries
    source_block_id: UUID | None = Field(foreign_key="block.id")
    target_block_id: UUID | None = Field(foreign_key="block.id")

    # --- TEMPORAL VALIDITY ---
    # When is this relationship valid in the timeline?
    # Example: "Character X ruled Kingdom Y from 450-490"
    timeline_start_year: int | None = None
    timeline_start_month: int | None = None
    timeline_start_day: int | None = None

    timeline_end_year: int | None = None
    timeline_end_month: int | None = None
    timeline_end_day: int | None = None

    # Temporal metadata
    timeline_is_circa: bool = False
    timeline_is_ongoing: bool = False
    timeline_display_override: str | None = None

    # Context and custom properties
    context: str | None = None  # Optional note about this relationship
    properties: dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    # Can store additional properties like: {"certainty": "confirmed", "source": "Book 3, Chapter 2"}

    # Position/ordering (for ordered relationships)
    position: float = 0.0

    # Audit fields
    created_by: UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: UUID = Field(foreign_key="user.id")
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: datetime | None = None

    __table_args__ = (
        Index("idx_reference_source", "source_entry_id"),
        Index("idx_reference_target", "target_entry_id"),
        Index("idx_reference_type", "reference_type_id"),
        Index("idx_reference_timeline_start", "timeline_start_year"),
        Index("idx_reference_timeline_end", "timeline_end_year"),
        # Composite indexes for common queries
        Index("idx_reference_source_type", "source_entry_id", "reference_type_id"),
        Index("idx_reference_target_type", "target_entry_id", "reference_type_id"),
        Index(
            "idx_reference_temporal",
            "source_entry_id",
            "timeline_start_year",
            "timeline_end_year",
        ),
    )

    def is_valid_at_year(self, year: int) -> bool:
        """Check if this reference is valid at a given year in the timeline."""
        if self.timeline_start_year is not None and year < self.timeline_start_year:
            return False
        if self.timeline_end_year is not None and year > self.timeline_end_year:
            return False
        return True


class Tag(SQLModel, table=True):
    """Tags for organizing and categorizing entries.

    Tags are simpler than references - just labels for filtering/grouping.
    """

    __tablename__ = "tag"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    world_id: UUID = Field(foreign_key="world.id", index=True)

    # Core fields
    name: str
    slug: str

    # Display
    color: str = "#6B7280"
    icon: str | None = None

    # Description
    description: str | None = None

    # Category/grouping
    tag_group: str | None = None  # e.g., "Status", "Genre", "Theme"

    # Metadata
    created_by: UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: datetime | None = None

    __table_args__ = (
        UniqueConstraint("world_id", "slug"),
        Index("idx_tag_world", "world_id"),
    )


class EntryTag(SQLModel, table=True):
    """Many-to-many relationship between entries and tags."""

    __tablename__ = "entry_tag"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    entry_id: UUID = Field(foreign_key="entry.id", index=True)
    tag_id: UUID = Field(foreign_key="tag.id", index=True)

    # Metadata
    created_by: UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("entry_id", "tag_id"),
        Index("idx_entry_tag_entry", "entry_id"),
        Index("idx_entry_tag_tag", "tag_id"),
    )


# Re-export for convenience
__all__ = [
    "ReferenceType",
    "Reference",
    "Tag",
    "EntryTag",
]
