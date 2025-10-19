"""CRUD operations for Tag models."""

from typing import Any
from uuid import UUID

from sqlmodel import Session, col, select

from app.models.reference import Tag


def create_tag(
    *,
    session: Session,
    tag_create: dict[str, Any],
    world_id: UUID,
    user_id: UUID,
) -> Tag:
    """Create a new Tag.

    Args:
        session: Database session
        tag_create: Dictionary with tag data
        world_id: UUID of the world
        user_id: UUID of the user creating the tag

    Returns:
        Created Tag object
    """
    tag = Tag(
        **tag_create,
        world_id=world_id,
        created_by=user_id,
    )
    session.add(tag)
    session.commit()
    session.refresh(tag)
    return tag


def get_tag(*, session: Session, tag_id: UUID) -> Tag | None:
    """Get a tag by ID.

    Args:
        session: Database session
        tag_id: UUID of the tag

    Returns:
        Tag object or None if not found
    """
    return session.get(Tag, tag_id)


def get_tag_by_slug(
    *,
    session: Session,
    world_id: UUID,
    slug: str,
) -> Tag | None:
    """Get a tag by slug within a world.

    Args:
        session: Database session
        world_id: UUID of the world
        slug: Unique slug of the tag

    Returns:
        Tag object or None if not found
    """
    statement = (
        select(Tag)
        .where(Tag.world_id == world_id)
        .where(Tag.slug == slug)
        .where(col(Tag.deleted_at).is_(None))
    )
    return session.exec(statement).first()


def get_world_tags(
    *,
    session: Session,
    world_id: UUID,
    skip: int = 0,
    limit: int = 1000,  # Higher default for tags
) -> list[Tag]:
    """Get all tags in a world.

    Args:
        session: Database session
        world_id: UUID of the world
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return

    Returns:
        List of Tag objects
    """
    statement = (
        select(Tag)
        .where(Tag.world_id == world_id)
        .where(col(Tag.deleted_at).is_(None))
        .order_by(Tag.name)
        .offset(skip)
        .limit(limit)
    )
    return list(session.exec(statement).all())


def update_tag(
    *,
    session: Session,
    tag: Tag,
    tag_update: dict[str, Any],
) -> Tag:
    """Update a tag.

    Args:
        session: Database session
        tag: Tag object to update
        tag_update: Dictionary with updated fields

    Returns:
        Updated Tag object
    """
    for key, value in tag_update.items():
        setattr(tag, key, value)

    session.add(tag)
    session.commit()
    session.refresh(tag)
    return tag


def delete_tag(*, session: Session, tag: Tag) -> None:
    """Soft delete a tag.

    Args:
        session: Database session
        tag: Tag object to delete
    """
    from datetime import datetime

    tag.deleted_at = datetime.utcnow()
    session.add(tag)
    session.commit()


def get_entry_tags(*, session: Session, entry_id: UUID) -> list[Tag]:
    """Get all tags for an entry.

    Args:
        session: Database session
        entry_id: UUID of the entry

    Returns:
        List of Tag objects
    """
    from app.models.reference import EntryTag

    statement = (
        select(Tag)
        .join(EntryTag, Tag.id == EntryTag.tag_id)  # type: ignore
        .where(EntryTag.entry_id == entry_id)
        .where(col(Tag.deleted_at).is_(None))
        .order_by(Tag.name)
    )
    return list(session.exec(statement).all())


def get_entries_tags_map(
    *,
    session: Session,
    entry_ids: set[UUID],
) -> dict[UUID, list[str]]:
    """Get tags for multiple entries.

    Args:
        session: Database session
        entry_ids: Set of entry UUIDs

    Returns:
        Dictionary mapping entry_id to list of tag names
    """
    from app.models.reference import EntryTag

    statement = (
        select(EntryTag.entry_id, Tag.name)
        .join(Tag, Tag.id == EntryTag.tag_id)  # type: ignore
        .where(col(EntryTag.entry_id).in_(entry_ids))
        .where(col(Tag.deleted_at).is_(None))
        .order_by(Tag.name)
    )

    results = session.exec(statement).all()

    # Group tags by entry_id
    tags_map: dict[UUID, list[str]] = {}
    for entry_id, tag_name in results:
        if entry_id not in tags_map:
            tags_map[entry_id] = []
        tags_map[entry_id].append(tag_name)

    return tags_map
