"""Block-based content system with temporal support.

Entries contain their content as blocks (similar to Notion).
Each block can describe content for a specific time period in the timeline.

Example: A location entry might have:
- Block 1: "In Year 100, this was a small village..." (timeline: 100-200)
- Block 2: "By Year 200, it had grown into a city..." (timeline: 200-500)
- Block 3: "Present day description..." (timeline: 500-ongoing)
"""

from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlmodel import Column, Field, Index, JSON, SQLModel


class Block(SQLModel, table=True):
    """A content block within an entry.

    Blocks can be nested and support various content types.
    Each block can optionally have temporal validity.
    """

    __tablename__ = "block"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Parent relationships
    entry_id: UUID = Field(foreign_key="entry.id", index=True)
    parent_block_id: UUID | None = Field(foreign_key="block.id", index=True)

    # Block type determines how content is rendered
    block_type: str
    # Supported types:
    # Text blocks:
    # - paragraph, heading1, heading2, heading3, quote, callout
    # List blocks:
    # - bullet_list, numbered_list, checklist, toggle_list
    # Media blocks:
    # - image, video, file, embed, audio
    # Structured blocks:
    # - table, database_view, code, equation
    # Special blocks:
    # - reference (embed another entry), timeline_event, map_marker
    # - divider, table_of_contents

    # Content structure (varies by block_type)
    content: dict = Field(default={}, sa_column=Column(JSON))
    # Example content structures:
    # paragraph: {"text": [{"text": "Hello", "bold": true}, ...], "color": "default"}
    # heading1: {"text": "Chapter Title", "toggleable": false}
    # image: {"url": "...", "caption": "...", "width": 500}
    # reference: {"entry_id": "uuid", "display": "inline|card|embed"}
    # timeline_event: {"year": 450, "title": "Battle of...", "description": "..."}
    # table: {"columns": [...], "rows": [...]}
    # code: {"language": "python", "code": "...", "caption": "..."}

    # --- TEMPORAL VALIDITY ---
    # When is this block's content relevant in the timeline?
    # Example: "During the reign of King Arthur (450-490), the castle was..."
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

    # Position among siblings (fractional indexing)
    position: float = 0.0

    # Version tracking
    version: int = 1

    # Display settings
    is_collapsed: bool = False  # For toggle lists
    background_color: str | None = None
    text_color: str | None = None

    # Metadata
    created_by: UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: UUID = Field(foreign_key="user.id")
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Soft delete
    deleted_at: datetime | None = None

    __table_args__ = (
        Index("idx_block_entry", "entry_id"),
        Index("idx_block_parent", "parent_block_id"),
        Index("idx_block_timeline_start", "timeline_start_year"),
        Index("idx_block_timeline_end", "timeline_end_year"),
        Index("idx_block_type", "block_type"),
        # Composite index for entry+timeline queries
        Index(
            "idx_block_entry_timeline",
            "entry_id",
            "timeline_start_year",
            "timeline_end_year",
        ),
    )

    def is_valid_at_year(self, year: int) -> bool:
        """Check if this block is valid at a given year in the timeline."""
        if self.timeline_start_year is not None and year < self.timeline_start_year:
            return False
        if self.timeline_end_year is not None and year > self.timeline_end_year:
            return False
        return True


class BlockVersion(SQLModel, table=True):
    """Version history for blocks.

    Tracks changes to block content over time (real-world time, not timeline).
    """

    __tablename__ = "block_version"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    block_id: UUID = Field(foreign_key="block.id", index=True)
    version_number: int

    # Snapshot of block state
    block_type: str
    content: dict = Field(sa_column=Column(JSON))
    position: float

    # Temporal snapshot
    timeline_start_year: int | None = None
    timeline_end_year: int | None = None

    # Version metadata
    created_by: UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    change_summary: str | None = None

    __table_args__ = (
        Index("idx_block_version_block", "block_id"),
        Index("idx_block_version_number", "block_id", "version_number"),
    )


class Comment(SQLModel, table=True):
    """Comments on entries and blocks.

    Supports threaded discussions.
    """

    __tablename__ = "comment"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # What is being commented on
    entry_id: UUID = Field(foreign_key="entry.id", index=True)
    block_id: UUID | None = Field(foreign_key="block.id", index=True)

    # Threading
    parent_comment_id: UUID | None = Field(foreign_key="comment.id", index=True)

    # Content
    content: str
    content_format: str = "markdown"  # 'markdown', 'plain', 'html'

    # Status
    is_resolved: bool = False
    resolved_by: UUID | None = Field(foreign_key="user.id")
    resolved_at: datetime | None = None

    # Reactions (emoji reactions to comments)
    reactions: dict = Field(default={}, sa_column=Column(JSON))
    # Example: {"👍": ["user_uuid1", "user_uuid2"], "❤️": ["user_uuid3"]}

    # Metadata
    created_by: UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime | None = None
    deleted_at: datetime | None = None

    __table_args__ = (
        Index("idx_comment_entry", "entry_id"),
        Index("idx_comment_block", "block_id"),
        Index("idx_comment_parent", "parent_comment_id"),
        Index("idx_comment_resolved", "is_resolved"),
    )


class Attachment(SQLModel, table=True):
    """File attachments for entries and blocks.

    Stores metadata for uploaded files (images, PDFs, etc.)
    """

    __tablename__ = "attachment"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # What this is attached to
    entry_id: UUID | None = Field(foreign_key="entry.id", index=True)
    block_id: UUID | None = Field(foreign_key="block.id", index=True)
    world_id: UUID = Field(foreign_key="world.id", index=True)

    # File metadata
    filename: str
    original_filename: str
    mime_type: str
    size_bytes: int

    # Storage
    storage_provider: str = "local"  # 'local', 's3', 'gcs', etc.
    storage_path: str
    storage_url: str | None = None  # Public URL if available

    # Image-specific metadata
    width: int | None = None
    height: int | None = None
    thumbnail_url: str | None = None

    # Metadata
    uploaded_by: UUID = Field(foreign_key="user.id")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: datetime | None = None

    __table_args__ = (
        Index("idx_attachment_entry", "entry_id"),
        Index("idx_attachment_block", "block_id"),
        Index("idx_attachment_world", "world_id"),
    )


# Re-export for convenience
__all__ = [
    "Block",
    "BlockVersion",
    "Comment",
    "Attachment",
]
