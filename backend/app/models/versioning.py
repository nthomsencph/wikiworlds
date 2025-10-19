"""Version history and audit trail for entries.

Tracks changes to entries over time (real-world time, not timeline).
"""

from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlmodel import JSON, Column, Field, Index, SQLModel


class EntryVersion(SQLModel, table=True):
    """Snapshot of an entry at a specific point in time.

    Captures the complete state of an entry for version history and rollback.
    """

    __tablename__ = "entry_version"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    entry_id: UUID = Field(foreign_key="entry.id", index=True)

    version_number: int  # Incrementing version number (1, 2, 3, ...)

    # Snapshot of entry state
    title: str
    path: str  # Captures renames/moves
    entry_type_id: UUID

    # Temporal snapshot (what timeline period did this entry represent?)
    timeline_start_year: int | None = None
    timeline_end_year: int | None = None

    # Snapshot of field values
    field_values: dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    # Format: {"field_def_id": {"value": {...}, "timeline_start": ..., "timeline_end": ...}}

    # Version metadata
    created_by: UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    change_summary: str | None = None  # User-provided description of changes
    is_major: bool = False  # Major version (significant changes) vs minor

    # Auto-generated diff summary
    changes: dict[str, list[str]] = Field(default={}, sa_column=Column(JSON))
    # Example: {"fields_changed": ["title", "ruler"], "fields_added": ["population"]}

    __table_args__ = (
        Index("idx_entry_version_entry", "entry_id"),
        Index("idx_entry_version_number", "entry_id", "version_number"),
        Index("idx_entry_version_created", "created_at"),
    )


class ActivityLog(SQLModel, table=True):
    """Activity feed for tracking all actions in a world.

    Provides an audit trail and activity timeline.
    """

    __tablename__ = "activity_log"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Scope
    world_id: UUID = Field(foreign_key="world.id", index=True)
    weave_id: UUID = Field(foreign_key="weave.id", index=True)

    # Actor
    user_id: UUID = Field(foreign_key="user.id", index=True)

    # Action
    action: str  # 'create', 'update', 'delete', 'comment', 'share', etc.
    resource_type: str  # 'entry', 'block', 'reference', 'comment', etc.
    resource_id: UUID

    # Context
    details: dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    # Example: {"entry_title": "Camelot", "fields_changed": ["ruler"], "old_value": "...", "new_value": "..."}

    # Related resources
    parent_resource_type: str | None = None  # e.g., 'entry' for a block
    parent_resource_id: UUID | None = None

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    ip_address: str | None = None
    user_agent: str | None = None

    __table_args__ = (
        Index("idx_activity_world", "world_id"),
        Index("idx_activity_weave", "weave_id"),
        Index("idx_activity_user", "user_id"),
        Index("idx_activity_resource", "resource_type", "resource_id"),
        Index("idx_activity_created", "created_at"),
    )


class SavedView(SQLModel, table=True):
    """Saved views/filters for entries.

    Allows users to save complex queries and filters.
    """

    __tablename__ = "saved_view"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    world_id: UUID = Field(foreign_key="world.id", index=True)

    # Core fields
    name: str
    description: str | None = None

    # View configuration
    view_type: str = "table"  # 'table', 'gallery', 'timeline', 'map', 'graph'

    # Filters and sorting
    filters: dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    # Example: {
    #   "entry_type": ["character"],
    #   "tags": ["protagonist"],
    #   "timeline_year": {"min": 100, "max": 500},
    #   "custom_fields": {"alignment": "good"}
    # }

    sort: list[dict[str, Any]] = Field(default=[], sa_column=Column(JSON))
    # Example: [{"field": "title", "direction": "asc"}]

    # Display settings
    visible_fields: list[str] = Field(default=[], sa_column=Column(JSON))
    # Which fields to show in the view

    # Timeline-specific settings (if view_type == 'timeline')
    timeline_settings: dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    # Example: {"group_by": "entry_type", "show_ongoing": true}

    # Sharing
    is_public: bool = False  # Can other users in the world see this view?
    is_default: bool = False  # Is this the default view for this world?

    # Metadata
    created_by: UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: datetime | None = None

    __table_args__ = (
        Index("idx_saved_view_world", "world_id"),
        Index("idx_saved_view_creator", "created_by"),
    )


# Re-export for convenience
__all__ = [
    "EntryVersion",
    "ActivityLog",
    "SavedView",
]
