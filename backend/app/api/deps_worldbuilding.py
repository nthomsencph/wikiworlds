"""Dependencies for worldbuilding API routes.

Provides multi-tenancy context and permission checks for Weaves and Worlds.
"""

from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, Path, status
from sqlmodel import Session

from app.api.deps import CurrentUser, get_db
from app.db.crud import weave as weave_crud
from app.db.crud import world as world_crud
from app.models.user import User
from app.models.weave import Weave, WeaveUser, World, WorldUser


def get_current_weave(
    *,
    session: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
    weave_id: Annotated[UUID, Path()],
) -> Weave:
    """Get current weave and verify user has access.

    Args:
        session: Database session
        current_user: Current authenticated user
        weave_id: UUID of the weave from path parameter

    Returns:
        Weave object

    Raises:
        HTTPException: If weave not found or user doesn't have access
    """
    weave = weave_crud.get_weave(session=session, weave_id=weave_id)

    if not weave:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Weave not found",
        )

    # Check user has access to this weave
    weave_user = weave_crud.get_weave_user(
        session=session,
        weave_id=weave_id,
        user_id=current_user.id,
    )

    if not weave_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this weave",
        )

    return weave


def get_current_weave_user(
    *,
    session: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
    weave: Annotated[Weave, Depends(get_current_weave)],
) -> WeaveUser:
    """Get current user's membership in the weave.

    Args:
        session: Database session
        current_user: Current authenticated user
        weave: Current weave (from dependency)

    Returns:
        WeaveUser object

    Raises:
        HTTPException: If user is not a member
    """
    weave_user = weave_crud.get_weave_user(
        session=session,
        weave_id=weave.id,
        user_id=current_user.id,
    )

    if not weave_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this weave",
        )

    return weave_user


def require_weave_owner(
    weave_user: Annotated[WeaveUser, Depends(get_current_weave_user)],
) -> WeaveUser:
    """Require user to be weave owner.

    Args:
        weave_user: Current user's weave membership

    Returns:
        WeaveUser object

    Raises:
        HTTPException: If user is not an owner
    """
    if weave_user.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only weave owners can perform this action",
        )
    return weave_user


def require_weave_admin(
    weave_user: Annotated[WeaveUser, Depends(get_current_weave_user)],
) -> WeaveUser:
    """Require user to be weave owner or admin.

    Args:
        weave_user: Current user's weave membership

    Returns:
        WeaveUser object

    Raises:
        HTTPException: If user is not an owner or admin
    """
    if weave_user.role not in ("owner", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only weave owners and admins can perform this action",
        )
    return weave_user


def get_current_world(
    *,
    session: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
    weave: Annotated[Weave, Depends(get_current_weave)],
    world_id: Annotated[UUID, Path()],
) -> World:
    """Get current world and verify it belongs to the weave.

    Args:
        session: Database session
        current_user: Current authenticated user
        weave: Current weave (from dependency)
        world_id: UUID of the world from path parameter

    Returns:
        World object

    Raises:
        HTTPException: If world not found or doesn't belong to weave
    """
    world = world_crud.get_world(session=session, world_id=world_id)

    if not world:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="World not found",
        )

    # Verify world belongs to the weave
    if world.weave_id != weave.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="World not found in this weave",
        )

    # For public worlds, anyone can view
    if world.is_public:
        return world

    # For private worlds, check user has access
    world_user = world_crud.get_world_user(
        session=session,
        world_id=world_id,
        user_id=current_user.id,
    )

    if not world_user:
        # Check if user has weave-level access (admins can see all worlds)
        weave_user = weave_crud.get_weave_user(
            session=session,
            weave_id=weave.id,
            user_id=current_user.id,
        )

        if not weave_user or weave_user.role not in ("owner", "admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this world",
            )

    return world


def get_current_world_user(
    *,
    session: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
    world: Annotated[World, Depends(get_current_world)],
) -> WorldUser | None:
    """Get current user's membership in the world.

    Returns None if user doesn't have explicit world membership
    (they might have access via weave membership).

    Args:
        session: Database session
        current_user: Current authenticated user
        world: Current world (from dependency)

    Returns:
        WorldUser object or None
    """
    return world_crud.get_world_user(
        session=session,
        world_id=world.id,
        user_id=current_user.id,
    )


def require_world_admin(
    *,
    session: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
    world: Annotated[World, Depends(get_current_world)],
    weave_user: Annotated[WeaveUser, Depends(get_current_weave_user)],
) -> WorldUser:
    """Require user to be world admin or weave owner/admin.

    Args:
        session: Database session
        current_user: Current authenticated user
        world: Current world
        weave_user: Current user's weave membership

    Returns:
        WorldUser object

    Raises:
        HTTPException: If user doesn't have admin permissions
    """
    # Weave owners and admins have admin access to all worlds
    if weave_user.role in ("owner", "admin"):
        # Return or create a virtual WorldUser
        world_user = world_crud.get_world_user(
            session=session,
            world_id=world.id,
            user_id=current_user.id,
        )
        if world_user:
            return world_user

        # Create virtual admin membership for weave admins
        return WorldUser(
            world_id=world.id,
            user_id=current_user.id,
            role="admin",
            status="active",
        )

    # Check world-level permission
    world_user = world_crud.get_world_user(
        session=session,
        world_id=world.id,
        user_id=current_user.id,
    )

    if not world_user or world_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only world admins can perform this action",
        )

    return world_user


def require_world_editor(
    *,
    session: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
    world: Annotated[World, Depends(get_current_world)],
    weave_user: Annotated[WeaveUser, Depends(get_current_weave_user)],
) -> WorldUser:
    """Require user to be world editor/admin or weave owner/admin.

    Args:
        session: Database session
        current_user: Current authenticated user
        world: Current world
        weave_user: Current user's weave membership

    Returns:
        WorldUser object

    Raises:
        HTTPException: If user doesn't have editor permissions
    """
    # Weave owners and admins have editor access to all worlds
    if weave_user.role in ("owner", "admin"):
        world_user = world_crud.get_world_user(
            session=session,
            world_id=world.id,
            user_id=current_user.id,
        )
        if world_user:
            return world_user

        # Create virtual editor membership for weave admins
        return WorldUser(
            world_id=world.id,
            user_id=current_user.id,
            role="editor",
            status="active",
        )

    # Check world-level permission
    world_user = world_crud.get_world_user(
        session=session,
        world_id=world.id,
        user_id=current_user.id,
    )

    if not world_user or world_user.role not in ("admin", "editor"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only world editors and admins can perform this action",
        )

    return world_user


# Type aliases for convenience
CurrentWeave = Annotated[Weave, Depends(get_current_weave)]
CurrentWeaveUser = Annotated[WeaveUser, Depends(get_current_weave_user)]
CurrentWorld = Annotated[World, Depends(get_current_world)]
CurrentWorldUser = Annotated[WorldUser | None, Depends(get_current_world_user)]
WeaveOwner = Annotated[WeaveUser, Depends(require_weave_owner)]
WeaveAdmin = Annotated[WeaveUser, Depends(require_weave_admin)]
WorldAdmin = Annotated[WorldUser, Depends(require_world_admin)]
WorldEditor = Annotated[WorldUser, Depends(require_world_editor)]
