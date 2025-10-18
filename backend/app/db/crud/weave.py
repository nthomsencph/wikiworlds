"""CRUD operations for Weave and WeaveUser models."""

from typing import Any
from uuid import UUID

from sqlmodel import Session, select

from app.models.weave import Weave, WeaveUser


def create_weave(*, session: Session, weave_create: dict[str, Any], user_id: UUID) -> Weave:
    """Create a new Weave and add the creator as owner.

    Args:
        session: Database session
        weave_create: Dictionary with weave data (name, slug, description, etc.)
        user_id: UUID of the user creating the weave

    Returns:
        Created Weave object
    """
    # Create the weave
    db_weave = Weave(
        **weave_create,
        created_by=user_id,
    )
    session.add(db_weave)
    session.flush()  # Get the weave ID without committing

    # Add creator as owner
    weave_user = WeaveUser(
        weave_id=db_weave.id,
        user_id=user_id,
        role="owner",
    )
    session.add(weave_user)
    session.commit()
    session.refresh(db_weave)

    return db_weave


def get_weave(*, session: Session, weave_id: UUID) -> Weave | None:
    """Get a weave by ID.

    Args:
        session: Database session
        weave_id: UUID of the weave

    Returns:
        Weave object or None if not found
    """
    return session.get(Weave, weave_id)


def get_weave_by_slug(*, session: Session, slug: str) -> Weave | None:
    """Get a weave by slug.

    Args:
        session: Database session
        slug: Unique slug of the weave

    Returns:
        Weave object or None if not found
    """
    statement = select(Weave).where(Weave.slug == slug).where(Weave.deleted_at.is_(None))
    return session.exec(statement).first()


def get_user_weaves(*, session: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> list[Weave]:
    """Get all weaves a user has access to.

    Args:
        session: Database session
        user_id: UUID of the user
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return

    Returns:
        List of Weave objects
    """
    statement = (
        select(Weave)
        .join(WeaveUser)
        .where(WeaveUser.user_id == user_id)
        .where(WeaveUser.status == "active")
        .where(Weave.deleted_at.is_(None))
        .offset(skip)
        .limit(limit)
    )
    return list(session.exec(statement).all())


def update_weave(*, session: Session, weave: Weave, weave_update: dict[str, Any]) -> Weave:
    """Update a weave.

    Args:
        session: Database session
        weave: Weave object to update
        weave_update: Dictionary with updated fields

    Returns:
        Updated Weave object
    """
    for key, value in weave_update.items():
        setattr(weave, key, value)

    session.add(weave)
    session.commit()
    session.refresh(weave)
    return weave


def delete_weave(*, session: Session, weave: Weave) -> None:
    """Soft delete a weave.

    Args:
        session: Database session
        weave: Weave object to delete
    """
    from datetime import datetime
    weave.deleted_at = datetime.utcnow()
    session.add(weave)
    session.commit()


def get_weave_user(*, session: Session, weave_id: UUID, user_id: UUID) -> WeaveUser | None:
    """Get a user's membership in a weave.

    Args:
        session: Database session
        weave_id: UUID of the weave
        user_id: UUID of the user

    Returns:
        WeaveUser object or None if not found
    """
    statement = (
        select(WeaveUser)
        .where(WeaveUser.weave_id == weave_id)
        .where(WeaveUser.user_id == user_id)
    )
    return session.exec(statement).first()


def add_weave_user(
    *,
    session: Session,
    weave_id: UUID,
    user_id: UUID,
    role: str,
    invited_by: UUID,
) -> WeaveUser:
    """Add a user to a weave.

    Args:
        session: Database session
        weave_id: UUID of the weave
        user_id: UUID of the user to add
        role: Role to assign (owner, admin, member)
        invited_by: UUID of the user inviting

    Returns:
        Created WeaveUser object
    """
    weave_user = WeaveUser(
        weave_id=weave_id,
        user_id=user_id,
        role=role,
        invited_by=invited_by,
        status="active",
    )
    session.add(weave_user)
    session.commit()
    session.refresh(weave_user)
    return weave_user


def update_weave_user_role(*, session: Session, weave_user: WeaveUser, role: str) -> WeaveUser:
    """Update a user's role in a weave.

    Args:
        session: Database session
        weave_user: WeaveUser object to update
        role: New role

    Returns:
        Updated WeaveUser object
    """
    weave_user.role = role
    session.add(weave_user)
    session.commit()
    session.refresh(weave_user)
    return weave_user


def remove_weave_user(*, session: Session, weave_user: WeaveUser) -> None:
    """Remove a user from a weave.

    Args:
        session: Database session
        weave_user: WeaveUser object to remove
    """
    session.delete(weave_user)
    session.commit()


def get_weave_members(*, session: Session, weave_id: UUID) -> list[WeaveUser]:
    """Get all members of a weave.

    Args:
        session: Database session
        weave_id: UUID of the weave

    Returns:
        List of WeaveUser objects
    """
    statement = (
        select(WeaveUser)
        .where(WeaveUser.weave_id == weave_id)
        .where(WeaveUser.status == "active")
    )
    return list(session.exec(statement).all())
