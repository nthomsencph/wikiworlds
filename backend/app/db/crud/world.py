"""CRUD operations for World and WorldUser models."""

from typing import Any
from uuid import UUID

from sqlmodel import Session, select

from app.models.weave import World, WorldUser
from app.models.timeline import WorldTimeline
from app.models.entry import EntryType
from app.db.crud.constants import DEFAULT_ENTRY_TYPES


def create_world(
    *,
    session: Session,
    world_create: dict[str, Any],
    weave_id: UUID,
    user_id: UUID,
) -> World:
    """Create a new World and add the creator as admin.

    Args:
        session: Database session
        world_create: Dictionary with world data (name, slug, description, etc.)
        weave_id: UUID of the parent weave
        user_id: UUID of the user creating the world

    Returns:
        Created World object
    """
    # Create the world
    db_world = World(
        **world_create,
        weave_id=weave_id,
        created_by=user_id,
        updated_by=user_id,
    )
    session.add(db_world)
    session.flush()  # Get the world ID without committing

    # Add creator as admin
    world_user = WorldUser(
        world_id=db_world.id,
        user_id=user_id,
        role="admin",
    )
    session.add(world_user)

    # Create default timeline
    timeline = WorldTimeline(
        world_id=db_world.id,
        name="Default Timeline",
    )
    session.add(timeline)

    # Create default entry types with hierarchy
    # First pass: create all parent (top-level) entry types
    entry_type_map = {}  # Map from name to EntryType object

    for entry_type_data in DEFAULT_ENTRY_TYPES:
        if entry_type_data.get("parent_name") is None:
            # This is a top-level entry type
            slug = entry_type_data["name"].lower().replace(" ", "-")

            # Remove parent_name from data before creating
            data = {k: v for k, v in entry_type_data.items() if k != "parent_name"}

            entry_type = EntryType(
                **data,
                slug=slug,
                world_id=db_world.id,
                created_by=user_id,
                is_system=True,  # Mark as system-provided entry type
            )
            session.add(entry_type)
            session.flush()  # Get the ID
            entry_type_map[entry_type.name] = entry_type

    # Second pass: create child entry types with parent_id references
    for entry_type_data in DEFAULT_ENTRY_TYPES:
        parent_name = entry_type_data.get("parent_name")
        if parent_name is not None:
            # This is a child entry type
            slug = entry_type_data["name"].lower().replace(" ", "-")

            # Get parent ID from map
            parent = entry_type_map.get(parent_name)
            if parent is None:
                # Parent not found, skip (shouldn't happen with proper constants)
                continue

            # Remove parent_name from data before creating
            data = {k: v for k, v in entry_type_data.items() if k != "parent_name"}

            entry_type = EntryType(
                **data,
                slug=slug,
                parent_id=parent.id,
                world_id=db_world.id,
                created_by=user_id,
                is_system=True,
            )
            session.add(entry_type)
            session.flush()  # Get the ID
            entry_type_map[entry_type.name] = entry_type

    session.commit()
    session.refresh(db_world)

    return db_world


def get_world(*, session: Session, world_id: UUID) -> World | None:
    """Get a world by ID.

    Args:
        session: Database session
        world_id: UUID of the world

    Returns:
        World object or None if not found
    """
    return session.get(World, world_id)


def get_world_by_slug(*, session: Session, weave_id: UUID, slug: str) -> World | None:
    """Get a world by slug within a weave.

    Args:
        session: Database session
        weave_id: UUID of the parent weave
        slug: Unique slug of the world (within the weave)

    Returns:
        World object or None if not found
    """
    statement = (
        select(World)
        .where(World.weave_id == weave_id)
        .where(World.slug == slug)
        .where(World.deleted_at.is_(None))
    )
    return session.exec(statement).first()


def get_weave_worlds(
    *,
    session: Session,
    weave_id: UUID,
    skip: int = 0,
    limit: int = 100,
) -> list[World]:
    """Get all worlds in a weave.

    Args:
        session: Database session
        weave_id: UUID of the weave
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return

    Returns:
        List of World objects
    """
    statement = (
        select(World)
        .where(World.weave_id == weave_id)
        .where(World.deleted_at.is_(None))
        .offset(skip)
        .limit(limit)
    )
    return list(session.exec(statement).all())


def get_user_worlds(
    *,
    session: Session,
    user_id: UUID,
    weave_id: UUID | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[World]:
    """Get all worlds a user has access to.

    Args:
        session: Database session
        user_id: UUID of the user
        weave_id: Optional UUID of weave to filter by
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return

    Returns:
        List of World objects
    """
    statement = (
        select(World)
        .join(WorldUser)
        .where(WorldUser.user_id == user_id)
        .where(WorldUser.status == "active")
        .where(World.deleted_at.is_(None))
    )

    if weave_id:
        statement = statement.where(World.weave_id == weave_id)

    statement = statement.offset(skip).limit(limit)
    return list(session.exec(statement).all())


def get_public_worlds(
    *, session: Session, skip: int = 0, limit: int = 100
) -> list[World]:
    """Get all public worlds.

    Args:
        session: Database session
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return

    Returns:
        List of public World objects
    """
    statement = (
        select(World)
        .where(World.is_public == True)  # noqa: E712
        .where(World.deleted_at.is_(None))
        .offset(skip)
        .limit(limit)
    )
    return list(session.exec(statement).all())


def update_world(
    *,
    session: Session,
    world: World,
    world_update: dict[str, Any],
    user_id: UUID,
) -> World:
    """Update a world.

    Args:
        session: Database session
        world: World object to update
        world_update: Dictionary with updated fields
        user_id: UUID of the user making the update

    Returns:
        Updated World object
    """
    from datetime import datetime

    for key, value in world_update.items():
        setattr(world, key, value)

    world.updated_by = user_id
    world.updated_at = datetime.utcnow()

    session.add(world)
    session.commit()
    session.refresh(world)
    return world


def delete_world(*, session: Session, world: World) -> None:
    """Soft delete a world.

    Args:
        session: Database session
        world: World object to delete
    """
    from datetime import datetime

    world.deleted_at = datetime.utcnow()
    session.add(world)
    session.commit()


def get_world_user(
    *, session: Session, world_id: UUID, user_id: UUID
) -> WorldUser | None:
    """Get a user's membership in a world.

    Args:
        session: Database session
        world_id: UUID of the world
        user_id: UUID of the user

    Returns:
        WorldUser object or None if not found
    """
    statement = (
        select(WorldUser)
        .where(WorldUser.world_id == world_id)
        .where(WorldUser.user_id == user_id)
    )
    return session.exec(statement).first()


def add_world_user(
    *,
    session: Session,
    world_id: UUID,
    user_id: UUID,
    role: str,
    invited_by: UUID,
) -> WorldUser:
    """Add a user to a world.

    Args:
        session: Database session
        world_id: UUID of the world
        user_id: UUID of the user to add
        role: Role to assign (admin, editor, commenter, viewer)
        invited_by: UUID of the user inviting

    Returns:
        Created WorldUser object
    """
    world_user = WorldUser(
        world_id=world_id,
        user_id=user_id,
        role=role,
        invited_by=invited_by,
        status="active",
    )
    session.add(world_user)
    session.commit()
    session.refresh(world_user)
    return world_user


def update_world_user_role(
    *, session: Session, world_user: WorldUser, role: str
) -> WorldUser:
    """Update a user's role in a world.

    Args:
        session: Database session
        world_user: WorldUser object to update
        role: New role

    Returns:
        Updated WorldUser object
    """
    world_user.role = role
    session.add(world_user)
    session.commit()
    session.refresh(world_user)
    return world_user


def remove_world_user(*, session: Session, world_user: WorldUser) -> None:
    """Remove a user from a world.

    Args:
        session: Database session
        world_user: WorldUser object to remove
    """
    session.delete(world_user)
    session.commit()


def get_world_members(*, session: Session, world_id: UUID) -> list[WorldUser]:
    """Get all members of a world.

    Args:
        session: Database session
        world_id: UUID of the world

    Returns:
        List of WorldUser objects
    """
    statement = (
        select(WorldUser)
        .where(WorldUser.world_id == world_id)
        .where(WorldUser.status == "active")
    )
    return list(session.exec(statement).all())
