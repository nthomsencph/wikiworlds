"""CRUD operations for EntryType and FieldDefinition models."""

from typing import Any
from uuid import UUID

from sqlmodel import Session, select

from app.models.entry import EntryType, FieldDefinition


# --- EntryType CRUD ---


def create_entry_type(
    *,
    session: Session,
    entry_type_create: dict[str, Any],
    world_id: UUID,
    user_id: UUID,
) -> EntryType:
    """Create a new EntryType.

    Args:
        session: Database session
        entry_type_create: Dictionary with entry type data
        world_id: UUID of the world
        user_id: UUID of the user creating the type

    Returns:
        Created EntryType object
    """
    entry_type = EntryType(
        **entry_type_create,
        world_id=world_id,
        created_by=user_id,
    )
    session.add(entry_type)
    session.commit()
    session.refresh(entry_type)
    return entry_type


def get_entry_type(*, session: Session, entry_type_id: UUID) -> EntryType | None:
    """Get an entry type by ID.

    Args:
        session: Database session
        entry_type_id: UUID of the entry type

    Returns:
        EntryType object or None if not found
    """
    return session.get(EntryType, entry_type_id)


def get_entry_type_by_slug(
    *,
    session: Session,
    world_id: UUID,
    slug: str,
) -> EntryType | None:
    """Get an entry type by slug within a world.

    Args:
        session: Database session
        world_id: UUID of the world
        slug: Unique slug of the entry type

    Returns:
        EntryType object or None if not found
    """
    statement = (
        select(EntryType)
        .where(EntryType.world_id == world_id)
        .where(EntryType.slug == slug)
        .where(EntryType.deleted_at.is_(None))
    )
    return session.exec(statement).first()


def get_world_entry_types(
    *,
    session: Session,
    world_id: UUID,
    skip: int = 0,
    limit: int = 100,
) -> list[EntryType]:
    """Get all entry types in a world.

    Args:
        session: Database session
        world_id: UUID of the world
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return

    Returns:
        List of EntryType objects
    """
    statement = (
        select(EntryType)
        .where(EntryType.world_id == world_id)
        .where(EntryType.deleted_at.is_(None))
        .offset(skip)
        .limit(limit)
    )
    return list(session.exec(statement).all())


def update_entry_type(
    *,
    session: Session,
    entry_type: EntryType,
    entry_type_update: dict[str, Any],
) -> EntryType:
    """Update an entry type.

    Args:
        session: Database session
        entry_type: EntryType object to update
        entry_type_update: Dictionary with updated fields

    Returns:
        Updated EntryType object
    """
    from datetime import datetime

    for key, value in entry_type_update.items():
        setattr(entry_type, key, value)

    entry_type.updated_at = datetime.utcnow()

    session.add(entry_type)
    session.commit()
    session.refresh(entry_type)
    return entry_type


def delete_entry_type(*, session: Session, entry_type: EntryType) -> None:
    """Soft delete an entry type.

    Args:
        session: Database session
        entry_type: EntryType object to delete
    """
    from datetime import datetime

    entry_type.deleted_at = datetime.utcnow()
    session.add(entry_type)
    session.commit()


# --- FieldDefinition CRUD ---


def create_field_definition(
    *,
    session: Session,
    field_definition_create: dict[str, Any],
    entry_type_id: UUID,
) -> FieldDefinition:
    """Create a new FieldDefinition.

    Args:
        session: Database session
        field_definition_create: Dictionary with field definition data
        entry_type_id: UUID of the entry type

    Returns:
        Created FieldDefinition object
    """
    # Get the current max position for this entry type
    statement = (
        select(FieldDefinition)
        .where(FieldDefinition.entry_type_id == entry_type_id)
        .order_by(FieldDefinition.position.desc())
    )
    last_field = session.exec(statement).first()
    next_position = (last_field.position + 1) if last_field else 0

    # Extract position from dict to avoid passing it twice
    position = field_definition_create.pop("position", next_position)

    field_definition = FieldDefinition(
        **field_definition_create,
        entry_type_id=entry_type_id,
        position=position,
    )
    session.add(field_definition)
    session.commit()
    session.refresh(field_definition)
    return field_definition


def get_field_definition(
    *,
    session: Session,
    field_definition_id: UUID,
) -> FieldDefinition | None:
    """Get a field definition by ID.

    Args:
        session: Database session
        field_definition_id: UUID of the field definition

    Returns:
        FieldDefinition object or None if not found
    """
    return session.get(FieldDefinition, field_definition_id)


def get_entry_type_fields(
    *,
    session: Session,
    entry_type_id: UUID,
) -> list[FieldDefinition]:
    """Get all field definitions for an entry type.

    Args:
        session: Database session
        entry_type_id: UUID of the entry type

    Returns:
        List of FieldDefinition objects ordered by position
    """
    statement = (
        select(FieldDefinition)
        .where(FieldDefinition.entry_type_id == entry_type_id)
        .order_by(FieldDefinition.position)
    )
    return list(session.exec(statement).all())


def update_field_definition(
    *,
    session: Session,
    field_definition: FieldDefinition,
    field_definition_update: dict[str, Any],
) -> FieldDefinition:
    """Update a field definition.

    Args:
        session: Database session
        field_definition: FieldDefinition object to update
        field_definition_update: Dictionary with updated fields

    Returns:
        Updated FieldDefinition object
    """
    from datetime import datetime

    for key, value in field_definition_update.items():
        setattr(field_definition, key, value)

    field_definition.updated_at = datetime.utcnow()

    session.add(field_definition)
    session.commit()
    session.refresh(field_definition)
    return field_definition


def delete_field_definition(
    *,
    session: Session,
    field_definition: FieldDefinition,
) -> None:
    """Delete a field definition.

    Args:
        session: Database session
        field_definition: FieldDefinition object to delete
    """
    session.delete(field_definition)
    session.commit()


def reorder_fields(
    *,
    session: Session,
    entry_type_id: UUID,
    field_positions: dict[UUID, int],
) -> list[FieldDefinition]:
    """Reorder field definitions for an entry type.

    Args:
        session: Database session
        entry_type_id: UUID of the entry type
        field_positions: Dictionary mapping field_id to new position

    Returns:
        List of updated FieldDefinition objects
    """
    fields = get_entry_type_fields(session=session, entry_type_id=entry_type_id)

    for field in fields:
        if field.id in field_positions:
            field.position = field_positions[field.id]
            session.add(field)

    session.commit()

    # Return fields in new order
    for field in fields:
        session.refresh(field)

    return sorted(fields, key=lambda f: f.position)
