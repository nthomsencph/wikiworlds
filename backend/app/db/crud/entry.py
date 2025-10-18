"""CRUD operations for Entry and FieldValue models with temporal support."""

from typing import Any
from uuid import UUID

from sqlmodel import Session, select, text

from app.models.entry import Entry, FieldValue
from app.utils.ltree import build_path, is_descendant_of
from app.utils.temporal import temporal_filter


# --- Entry CRUD ---


def create_entry(
    *,
    session: Session,
    entry_create: dict[str, Any],
    world_id: UUID,
    entry_type_id: UUID,
    user_id: UUID,
    parent_id: UUID | None = None,
) -> Entry:
    """Create a new Entry with ltree path.

    Args:
        session: Database session
        entry_create: Dictionary with entry data
        world_id: UUID of the world
        entry_type_id: UUID of the entry type
        user_id: UUID of the user creating the entry
        parent_id: UUID of the parent entry (None for root entries)

    Returns:
        Created Entry object
    """
    # Get parent entry if specified
    parent_path = None
    if parent_id:
        parent = session.get(Entry, parent_id)
        if not parent:
            raise ValueError(f"Parent entry {parent_id} not found")
        if parent.world_id != world_id:
            raise ValueError("Parent entry must be in the same world")
        parent_path = parent.path

    # Create the entry (without committing yet to get the ID)
    entry = Entry(
        **{k: v for k, v in entry_create.items() if k != "path"},
        world_id=world_id,
        entry_type_id=entry_type_id,
        created_by=user_id,
        updated_by=user_id,
        path="",  # Temporary, will be set after flush
    )
    session.add(entry)
    session.flush()  # Get the entry ID

    # Build and set the path
    entry.path = build_path(parent_path, entry.id)

    session.commit()
    session.refresh(entry)
    return entry


def get_entry(*, session: Session, entry_id: UUID) -> Entry | None:
    """Get an entry by ID.

    Args:
        session: Database session
        entry_id: UUID of the entry

    Returns:
        Entry object or None if not found
    """
    statement = (
        select(Entry).where(Entry.id == entry_id).where(Entry.deleted_at.is_(None))
    )
    return session.exec(statement).first()


def get_entry_by_slug(
    *,
    session: Session,
    world_id: UUID,
    slug: str,
) -> Entry | None:
    """Get an entry by slug within a world.

    Args:
        session: Database session
        world_id: UUID of the world
        slug: Unique slug of the entry

    Returns:
        Entry object or None if not found
    """
    statement = (
        select(Entry)
        .where(Entry.world_id == world_id)
        .where(Entry.slug == slug)
        .where(Entry.deleted_at.is_(None))
    )
    return session.exec(statement).first()


def get_world_entries(
    *,
    session: Session,
    world_id: UUID,
    entry_type_id: UUID | None = None,
    timeline_year: int | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Entry]:
    """Get entries in a world with optional filtering.

    Args:
        session: Database session
        world_id: UUID of the world
        entry_type_id: Optional entry type filter
        timeline_year: Optional timeline year filter
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return

    Returns:
        List of Entry objects
    """
    statement = (
        select(Entry)
        .where(Entry.world_id == world_id)
        .where(Entry.deleted_at.is_(None))
    )

    if entry_type_id:
        statement = statement.where(Entry.entry_type_id == entry_type_id)

    if timeline_year is not None:
        statement = statement.where(
            temporal_filter(
                Entry.timeline_start_year, Entry.timeline_end_year, year=timeline_year
            )
        )

    statement = statement.offset(skip).limit(limit)
    return list(session.exec(statement).all())


def get_root_entries(
    *,
    session: Session,
    world_id: UUID,
    entry_type_id: UUID | None = None,
) -> list[Entry]:
    """Get all root entries (no parent) in a world.

    Args:
        session: Database session
        world_id: UUID of the world
        entry_type_id: Optional entry type filter

    Returns:
        List of root Entry objects
    """
    # Root entries have path with no dots (single level)
    statement = (
        select(Entry)
        .where(Entry.world_id == world_id)
        .where(Entry.deleted_at.is_(None))
        .where(~Entry.path.contains("."))  # No dots = root level
    )

    if entry_type_id:
        statement = statement.where(Entry.entry_type_id == entry_type_id)

    return list(session.exec(statement).all())


def get_children(
    *,
    session: Session,
    parent_id: UUID,
    recursive: bool = False,
) -> list[Entry]:
    """Get child entries of a parent.

    Args:
        session: Database session
        parent_id: UUID of the parent entry
        recursive: If True, get all descendants; if False, get direct children only

    Returns:
        List of child Entry objects
    """
    parent = session.get(Entry, parent_id)
    if not parent:
        return []

    if recursive:
        # Get all descendants using ltree
        statement = (
            select(Entry)
            .where(Entry.world_id == parent.world_id)
            .where(Entry.deleted_at.is_(None))
            .where(text(f"path <@ '{parent.path}'"))  # ltree descendant operator
            .where(Entry.id != parent_id)  # Exclude the parent itself
        )
    else:
        # Get direct children only (path matches parent.path.%)
        statement = (
            select(Entry)
            .where(Entry.world_id == parent.world_id)
            .where(Entry.deleted_at.is_(None))
            .where(
                text(f"path ~ '{parent.path}.*{{1}}'")
            )  # ltree pattern for direct children
        )

    return list(session.exec(statement).all())


def get_ancestors(
    *,
    session: Session,
    entry_id: UUID,
) -> list[Entry]:
    """Get all ancestor entries (breadcrumb trail).

    Args:
        session: Database session
        entry_id: UUID of the entry

    Returns:
        List of ancestor Entry objects (from root to parent)
    """
    entry = session.get(Entry, entry_id)
    if not entry:
        return []

    # Use ltree to get all ancestors
    statement = (
        select(Entry)
        .where(Entry.world_id == entry.world_id)
        .where(Entry.deleted_at.is_(None))
        .where(
            text(f"'{entry.path}' <@ path")
        )  # Entry path is descendant of ancestor paths
        .where(Entry.id != entry_id)  # Exclude the entry itself
    )

    ancestors = list(session.exec(statement).all())

    # Sort by path depth (root first)
    return sorted(ancestors, key=lambda e: len(e.path.split(".")))


def update_entry(
    *,
    session: Session,
    entry: Entry,
    entry_update: dict[str, Any],
    user_id: UUID,
) -> Entry:
    """Update an entry.

    Args:
        session: Database session
        entry: Entry object to update
        entry_update: Dictionary with updated fields
        user_id: UUID of the user making the update

    Returns:
        Updated Entry object
    """
    from datetime import datetime

    for key, value in entry_update.items():
        if key != "path":  # Don't allow direct path updates
            setattr(entry, key, value)

    entry.updated_by = user_id
    entry.updated_at = datetime.utcnow()

    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry


def move_entry(
    *,
    session: Session,
    entry: Entry,
    new_parent_id: UUID | None,
) -> Entry:
    """Move an entry to a new parent (or to root).

    Args:
        session: Database session
        entry: Entry object to move
        new_parent_id: UUID of the new parent (None for root)

    Returns:
        Updated Entry object with new path
    """
    # Get new parent path
    new_parent_path = None
    if new_parent_id:
        new_parent = session.get(Entry, new_parent_id)
        if not new_parent:
            raise ValueError(f"Parent entry {new_parent_id} not found")
        if new_parent.world_id != entry.world_id:
            raise ValueError("Parent entry must be in the same world")

        # Check for circular reference
        if is_descendant_of(new_parent.path, entry.path):
            raise ValueError("Cannot move entry to one of its descendants")

        new_parent_path = new_parent.path

    old_path = entry.path
    new_path = build_path(new_parent_path, entry.id)

    # Update this entry's path
    entry.path = new_path
    session.add(entry)

    # Update all descendant paths
    descendants = get_children(session=session, parent_id=entry.id, recursive=True)
    for descendant in descendants:
        # Replace the old path prefix with the new one
        descendant.path = descendant.path.replace(old_path, new_path, 1)
        session.add(descendant)

    session.commit()
    session.refresh(entry)
    return entry


def delete_entry(*, session: Session, entry: Entry, recursive: bool = False) -> None:
    """Soft delete an entry.

    Args:
        session: Database session
        entry: Entry object to delete
        recursive: If True, also delete all descendants
    """
    from datetime import datetime

    entry.deleted_at = datetime.utcnow()
    session.add(entry)

    if recursive:
        descendants = get_children(session=session, parent_id=entry.id, recursive=True)
        for descendant in descendants:
            descendant.deleted_at = datetime.utcnow()
            session.add(descendant)

    session.commit()


# --- FieldValue CRUD ---


def set_field_value(
    *,
    session: Session,
    entry_id: UUID,
    field_definition_id: UUID,
    value: dict[str, Any],
    user_id: UUID,
    timeline_start_year: int | None = None,
    timeline_end_year: int | None = None,
    timeline_is_circa: bool = False,
    timeline_is_ongoing: bool = False,
) -> FieldValue:
    """Set a field value for an entry.

    For temporal fields, creates a new value record. For non-temporal fields,
    updates the existing value or creates a new one.

    Args:
        session: Database session
        entry_id: UUID of the entry
        field_definition_id: UUID of the field definition
        value: Value to set (as dict)
        user_id: UUID of the user setting the value
        timeline_start_year: Start year for temporal validity
        timeline_end_year: End year for temporal validity
        timeline_is_circa: Whether dates are approximate
        timeline_is_ongoing: Whether this value is currently active

    Returns:
        Created or updated FieldValue object
    """
    # For non-temporal fields, check if value already exists
    if timeline_start_year is None and timeline_end_year is None:
        statement = (
            select(FieldValue)
            .where(FieldValue.entry_id == entry_id)
            .where(FieldValue.field_definition_id == field_definition_id)
            .where(FieldValue.timeline_start_year.is_(None))
            .where(FieldValue.timeline_end_year.is_(None))
        )
        existing = session.exec(statement).first()

        if existing:
            # Update existing value
            existing.value = value
            existing.updated_by = user_id
            from datetime import datetime

            existing.updated_at = datetime.utcnow()
            session.add(existing)
            session.commit()
            session.refresh(existing)
            return existing

    # Create new field value
    field_value = FieldValue(
        entry_id=entry_id,
        field_definition_id=field_definition_id,
        value=value,
        timeline_start_year=timeline_start_year,
        timeline_end_year=timeline_end_year,
        timeline_is_circa=timeline_is_circa,
        timeline_is_ongoing=timeline_is_ongoing,
        created_by=user_id,
        updated_by=user_id,
    )
    session.add(field_value)
    session.commit()
    session.refresh(field_value)
    return field_value


def get_field_values(
    *,
    session: Session,
    entry_id: UUID,
    timeline_year: int | None = None,
) -> list[FieldValue]:
    """Get all field values for an entry.

    Args:
        session: Database session
        entry_id: UUID of the entry
        timeline_year: Optional year to filter temporal values

    Returns:
        List of FieldValue objects
    """
    statement = select(FieldValue).where(FieldValue.entry_id == entry_id)

    if timeline_year is not None:
        statement = statement.where(
            temporal_filter(
                FieldValue.timeline_start_year,
                FieldValue.timeline_end_year,
                year=timeline_year,
            )
        )

    return list(session.exec(statement).all())


def get_field_value_history(
    *,
    session: Session,
    entry_id: UUID,
    field_definition_id: UUID,
) -> list[FieldValue]:
    """Get all historical values for a specific field (temporal history).

    Args:
        session: Database session
        entry_id: UUID of the entry
        field_definition_id: UUID of the field definition

    Returns:
        List of FieldValue objects ordered by timeline
    """
    statement = (
        select(FieldValue)
        .where(FieldValue.entry_id == entry_id)
        .where(FieldValue.field_definition_id == field_definition_id)
        .order_by(FieldValue.timeline_start_year)
    )
    return list(session.exec(statement).all())


def delete_field_value(*, session: Session, field_value: FieldValue) -> None:
    """Delete a field value.

    Args:
        session: Database session
        field_value: FieldValue object to delete
    """
    session.delete(field_value)
    session.commit()


def get_entry_character_counts(
    *, session: Session, entry_ids: set[UUID]
) -> dict[UUID, int]:
    """Calculate character counts for a set of entries.

    Args:
        session: Database session
        entry_ids: Set of entry UUIDs to calculate character counts for

    Returns:
        Dictionary mapping entry_id to character count
    """
    from collections import defaultdict

    from sqlmodel import col

    from app.models.block import Block

    if not entry_ids:
        return {}

    # Fetch all blocks for the given entries
    blocks_statement = select(Block).where(col(Block.entry_id).in_(entry_ids))
    blocks = session.exec(blocks_statement).all()

    # Group blocks by entry_id
    entry_blocks = defaultdict(list)
    for block in blocks:
        entry_blocks[block.entry_id].append(block)

    # Calculate character counts for each entry
    character_count_map = {}
    for entry_id, block_list in entry_blocks.items():
        total_chars = 0
        for block in block_list:
            # Extract text from block content based on block type
            content = block.content
            if isinstance(content, dict):
                # Handle different block types
                if "text" in content:
                    text_content = content["text"]
                    if isinstance(text_content, str):
                        total_chars += len(text_content)
                    elif isinstance(text_content, list):
                        # Rich text format: [{"text": "Hello", ...}, ...]
                        for text_obj in text_content:
                            if isinstance(text_obj, dict) and "text" in text_obj:
                                total_chars += len(text_obj["text"])
                elif "html" in content:
                    # HTML content - strip tags for character count
                    import re

                    html_content = content["html"]
                    if isinstance(html_content, str):
                        # Simple HTML stripping (remove tags)
                        text_only = re.sub(r"<[^>]+>", "", html_content)
                        # Decode HTML entities
                        text_only = text_only.replace("&nbsp;", " ")
                        text_only = text_only.replace("&lt;", "<")
                        text_only = text_only.replace("&gt;", ">")
                        text_only = text_only.replace("&amp;", "&")
                        total_chars += len(text_only.strip())
        character_count_map[entry_id] = total_chars

    return character_count_map
