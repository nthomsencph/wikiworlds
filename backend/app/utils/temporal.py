"""Utilities for working with temporal data in the timeline.

Provides helper functions for temporal queries and filtering.
"""

from sqlalchemy import and_, or_
from sqlalchemy.sql.elements import ColumnElement


def temporal_filter(
    start_year_col: ColumnElement,
    end_year_col: ColumnElement,
    year: int | None = None,
    year_min: int | None = None,
    year_max: int | None = None,
) -> ColumnElement:
    """Create a SQL filter for temporal validity.

    This handles the logic for checking if an entity exists during a given year
    or year range, properly handling NULL values:
    - start_year = None means "ancient/unknown beginning"
    - end_year = None means "ongoing/current"

    Args:
        start_year_col: SQLAlchemy column for timeline_start_year
        end_year_col: SQLAlchemy column for timeline_end_year
        year: Specific year to filter by (mutually exclusive with year_min/year_max)
        year_min: Minimum year (inclusive)
        year_max: Maximum year (inclusive)

    Returns:
        SQLAlchemy filter condition

    Examples:
        >>> from app.models.entry import Entry
        >>> # Get all entries that existed in year 250
        >>> filter = temporal_filter(Entry.timeline_start_year, Entry.timeline_end_year, year=250)
        >>> entries = session.exec(select(Entry).where(filter)).all()

        >>> # Get all entries that existed between years 100-500
        >>> filter = temporal_filter(
        ...     Entry.timeline_start_year,
        ...     Entry.timeline_end_year,
        ...     year_min=100,
        ...     year_max=500
        ... )
    """
    if year is not None:
        # Filter by specific year
        return and_(
            or_(start_year_col.is_(None), start_year_col <= year),
            or_(end_year_col.is_(None), end_year_col >= year),
        )

    if year_min is not None or year_max is not None:
        # Filter by year range
        conditions = []

        if year_min is not None:
            # Entity must end after or during year_min
            conditions.append(or_(end_year_col.is_(None), end_year_col >= year_min))

        if year_max is not None:
            # Entity must start before or during year_max
            conditions.append(or_(start_year_col.is_(None), start_year_col <= year_max))

        return and_(*conditions) if conditions else True

    # No temporal filter
    return True


def overlaps_period(
    start_year_col: ColumnElement,
    end_year_col: ColumnElement,
    period_start: int | None,
    period_end: int | None,
) -> ColumnElement:
    """Check if an entity's temporal period overlaps with a given period.

    Args:
        start_year_col: SQLAlchemy column for timeline_start_year
        end_year_col: SQLAlchemy column for timeline_end_year
        period_start: Start year of the period to check
        period_end: End year of the period to check

    Returns:
        SQLAlchemy filter condition
    """
    # If either has unknown start/end, consider it as overlapping
    if period_start is None and period_end is None:
        return True

    conditions = []

    # Entity must start before the period ends
    if period_end is not None:
        conditions.append(or_(start_year_col.is_(None), start_year_col <= period_end))

    # Entity must end after the period starts
    if period_start is not None:
        conditions.append(or_(end_year_col.is_(None), end_year_col >= period_start))

    return and_(*conditions) if conditions else True


def is_ongoing(end_year_col: ColumnElement) -> ColumnElement:
    """Filter for entities that are currently ongoing (no end year).

    Args:
        end_year_col: SQLAlchemy column for timeline_end_year

    Returns:
        SQLAlchemy filter condition
    """
    return end_year_col.is_(None)


def has_ended(end_year_col: ColumnElement) -> ColumnElement:
    """Filter for entities that have ended (have an end year).

    Args:
        end_year_col: SQLAlchemy column for timeline_end_year

    Returns:
        SQLAlchemy filter condition
    """
    return end_year_col.isnot(None)


def is_ancient(start_year_col: ColumnElement) -> ColumnElement:
    """Filter for entities with unknown/ancient beginning (no start year).

    Args:
        start_year_col: SQLAlchemy column for timeline_start_year

    Returns:
        SQLAlchemy filter condition
    """
    return start_year_col.is_(None)


def format_temporal_display(
    start_year: int | None,
    end_year: int | None,
    is_circa: bool = False,
    is_ongoing: bool = False,
    display_override: str | None = None,
) -> str:
    """Format temporal period for display.

    Args:
        start_year: Start year (None = unknown/ancient)
        end_year: End year (None = ongoing/current)
        is_circa: Whether dates are approximate
        is_ongoing: Whether entity still exists
        display_override: Custom display string

    Returns:
        Formatted display string

    Examples:
        >>> format_temporal_display(450, 500)
        'Year 450 - 500'

        >>> format_temporal_display(450, None, is_ongoing=True)
        'Year 450 - Present'

        >>> format_temporal_display(None, 500)
        'Before Year 500'

        >>> format_temporal_display(450, 450, is_circa=True)
        'c. Year 450'
    """
    if display_override:
        return display_override

    prefix = "c. " if is_circa else ""

    if start_year is None and end_year is None:
        return "Unknown time"

    if start_year is None:
        return f"Before Year {end_year}"

    if end_year is None:
        if is_ongoing:
            return f"{prefix}Year {start_year} - Present"
        return f"{prefix}Since Year {start_year}"

    if start_year == end_year:
        return f"{prefix}Year {start_year}"

    return f"{prefix}Year {start_year} - {end_year}"
