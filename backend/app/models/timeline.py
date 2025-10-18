"""Timeline and temporal models for worldbuilding.

This module defines the temporal system that allows entries, fields, blocks,
and references to exist at specific points or periods in the fictional world timeline.
"""

from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlmodel import Column, Field, JSON, SQLModel


class WorldTimeline(SQLModel, table=True):
    """Configuration for a world's timeline system.

    Defines how time works in this world (calendar system, eras, etc.)
    """

    __tablename__ = "world_timeline"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    world_id: UUID = Field(foreign_key="world.id", index=True)

    # Timeline configuration
    name: str = "Default Timeline"

    # Calendar system
    calendar_type: str = "gregorian"  # 'gregorian', 'custom', 'multiple'

    # Year configuration
    year_zero: int = 0  # What year is "year 0" (e.g., 0 AD, 0 BR "Before Reckoning")
    year_zero_name: str | None = None  # e.g., "The Founding", "Creation"

    # Units of time (for custom calendars)
    time_units: dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    # Example: {"days_per_year": 365, "months": ["Jan", "Feb", ...], "custom_eras": [...]}

    # Display settings
    default_date_format: str = "Year {year}"  # How to display dates
    show_precise_dates: bool = False  # Whether to show day/month or just year

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Era(SQLModel, table=True):
    """Named periods in a world's history.

    Examples: "The Age of Dragons", "The Third Age", "The Old Kingdom"
    """

    __tablename__ = "era"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    world_timeline_id: UUID = Field(foreign_key="world_timeline.id", index=True)

    name: str
    description: str | None = None

    # Temporal validity
    start_year: int | None = None  # Null = "unknown beginning"
    end_year: int | None = None  # Null = "ongoing" or "unknown end"

    # Display
    color: str | None = None
    icon: str | None = None

    # Ordering
    position: int = 0

    created_at: datetime = Field(default_factory=datetime.utcnow)


class TimelineDate(SQLModel):
    """Represents a point or period in the fictional timeline.

    This is a reusable model (not a table) that can be embedded in other models.
    Can represent:
    - A specific point in time (start_year == end_year)
    - A time period (start_year to end_year)
    - An ongoing period (end_year is None)
    - Ancient/unknown start (start_year is None)
    """

    # Year-based timeline (can be negative for "before reckoning")
    start_year: int | None = None
    start_month: int | None = None  # 1-12 (if calendar supports months)
    start_day: int | None = None  # 1-31 (if calendar supports days)

    end_year: int | None = None
    end_month: int | None = None
    end_day: int | None = None

    # Display hints
    is_circa: bool = False  # "circa year 450" - approximate date
    is_ongoing: bool = False  # Still exists in current timeline

    # Custom display override
    display_override: str | None = None  # e.g., "The Ancient Past", "Unknown"

    def is_point_in_time(self) -> bool:
        """Check if this represents a single point rather than a period."""
        return (
            self.start_year is not None
            and self.end_year is not None
            and self.start_year == self.end_year
            and self.start_month == self.end_month
            and self.start_day == self.end_day
        )

    def contains_year(self, year: int) -> bool:
        """Check if a given year falls within this time period."""
        if self.start_year is not None and year < self.start_year:
            return False
        if self.end_year is not None and year > self.end_year:
            return False
        return True

    def overlaps(self, other: "TimelineDate") -> bool:
        """Check if this period overlaps with another."""
        # If either has unknown start/end, consider it as overlapping
        if self.start_year is None or other.start_year is None:
            if self.end_year is None or other.end_year is None:
                return True

        # Check for overlap
        if self.start_year is not None and other.end_year is not None:
            if self.start_year > other.end_year:
                return False

        if self.end_year is not None and other.start_year is not None:
            if self.end_year < other.start_year:
                return False

        return True

    def to_display_string(self) -> str:
        """Generate a human-readable display string."""
        if self.display_override:
            return self.display_override

        prefix = "c. " if self.is_circa else ""

        if self.start_year is None and self.end_year is None:
            return "Unknown time"

        if self.start_year is None:
            return f"Before Year {self.end_year}"

        if self.end_year is None:
            if self.is_ongoing:
                return f"{prefix}Year {self.start_year} - Present"
            return f"{prefix}Since Year {self.start_year}"

        if self.is_point_in_time():
            return f"{prefix}Year {self.start_year}"

        return f"{prefix}Year {self.start_year} - {self.end_year}"


# Re-export for convenience
__all__ = [
    "WorldTimeline",
    "Era",
    "TimelineDate",
]
