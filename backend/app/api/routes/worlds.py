"""API routes for World management."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.api.deps import CurrentUser, get_db
from app.api.deps_worldbuilding import (
    CurrentWeave,
    CurrentWorld,
    CurrentWorldUser,
    WeaveAdmin,
    WorldAdmin,
)
from app.db.crud import world as world_crud
from app.models.base import Message
from app.models.schemas.world import (
    WorldCreate,
    WorldPublic,
    WorldsPublic,
    WorldUpdate,
    WorldUserCreate,
    WorldUserPublic,
    WorldUserUpdate,
)

router = APIRouter()


@router.post("/", response_model=WorldPublic, status_code=status.HTTP_201_CREATED)
def create_world(
    *,
    session: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
    weave: CurrentWeave,
    world_in: WorldCreate,
) -> WorldPublic:
    """Create a new World within a Weave.

    The current user will be added as the admin.
    """
    # Check if slug is already taken within this weave
    existing = world_crud.get_world_by_slug(
        session=session,
        weave_id=weave.id,
        slug=world_in.slug,
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A world with this slug already exists in this weave",
        )

    world = world_crud.create_world(
        session=session,
        world_create=world_in.model_dump(),
        weave_id=weave.id,
        user_id=current_user.id,
    )

    return WorldPublic(**world.model_dump(), user_role="admin")


@router.get("/", response_model=WorldsPublic)
def list_weave_worlds(
    *,
    session: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
    weave: CurrentWeave,
    skip: int = 0,
    limit: int = 100,
) -> WorldsPublic:
    """Get all Worlds in a Weave that the current user has access to."""
    worlds = world_crud.get_user_worlds(
        session=session,
        user_id=current_user.id,
        weave_id=weave.id,
        skip=skip,
        limit=limit,
    )

    # Fetch roles for each world
    worlds_with_roles = []
    for world in worlds:
        world_user = world_crud.get_world_user(
            session=session,
            world_id=world.id,
            user_id=current_user.id,
        )
        worlds_with_roles.append(
            WorldPublic(**world.model_dump(), user_role=world_user.role if world_user else None)
        )

    return WorldsPublic(data=worlds_with_roles, count=len(worlds_with_roles))


@router.get("/public", response_model=WorldsPublic)
def list_public_worlds(
    *,
    session: Annotated[Session, Depends(get_db)],
    skip: int = 0,
    limit: int = 100,
) -> WorldsPublic:
    """Get all public Worlds (no authentication required)."""
    worlds = world_crud.get_public_worlds(session=session, skip=skip, limit=limit)

    return WorldsPublic(
        data=[WorldPublic(**world.model_dump(), user_role=None) for world in worlds],
        count=len(worlds),
    )


@router.get("/{world_id}", response_model=WorldPublic)
def get_world(
    *,
    world: CurrentWorld,
    world_user: CurrentWorldUser,
) -> WorldPublic:
    """Get a specific World by ID."""
    return WorldPublic(**world.model_dump(), user_role=world_user.role if world_user else None)


@router.patch("/{world_id}", response_model=WorldPublic)
def update_world(
    *,
    session: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
    world: CurrentWorld,
    world_admin: WorldAdmin,  # Only admins can update
    world_in: WorldUpdate,
) -> WorldPublic:
    """Update a World.

    Only world admins and weave owners/admins can update world settings.
    """
    updated_world = world_crud.update_world(
        session=session,
        world=world,
        world_update=world_in.model_dump(exclude_unset=True),
        user_id=current_user.id,
    )

    return WorldPublic(**updated_world.model_dump(), user_role=world_admin.role)


@router.delete("/{world_id}", response_model=Message)
def delete_world(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    world_admin: WorldAdmin,  # Only admins can delete
) -> Message:
    """Delete a World (soft delete).

    Only world admins and weave owners/admins can delete the world.
    This will also soft delete all entries within the world.
    """
    world_crud.delete_world(session=session, world=world)

    return Message(message="World deleted successfully")


# --- World Members Management ---


@router.get("/{world_id}/members", response_model=list[WorldUserPublic])
def list_world_members(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    world_user: CurrentWorldUser,  # Must have access to view members
) -> list[WorldUserPublic]:
    """Get all members of a World."""
    members = world_crud.get_world_members(session=session, world_id=world.id)

    # TODO: Join with User table to get user details
    return [WorldUserPublic(**member.model_dump()) for member in members]


@router.post("/{world_id}/members", response_model=WorldUserPublic, status_code=status.HTTP_201_CREATED)
def add_world_member(
    *,
    session: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
    world: CurrentWorld,
    world_admin: WorldAdmin,  # Only admins can invite members
    member_in: WorldUserCreate,
) -> WorldUserPublic:
    """Add a new member to a World.

    Only world admins and weave owners/admins can invite new members.
    """
    # Check if user is already a member
    existing = world_crud.get_world_user(
        session=session,
        world_id=world.id,
        user_id=member_in.user_id,
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this world",
        )

    new_member = world_crud.add_world_user(
        session=session,
        world_id=world.id,
        user_id=member_in.user_id,
        role=member_in.role,
        invited_by=current_user.id,
    )

    return WorldUserPublic(**new_member.model_dump())


@router.patch("/{world_id}/members/{user_id}", response_model=WorldUserPublic)
def update_member_role(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    world_admin: WorldAdmin,  # Only admins can change roles
    user_id: UUID,
    role_in: WorldUserUpdate,
) -> WorldUserPublic:
    """Update a member's role in a World.

    Only world admins and weave owners/admins can update member roles.
    """
    member = world_crud.get_world_user(
        session=session,
        world_id=world.id,
        user_id=user_id,
    )

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not a member of this world",
        )

    updated_member = world_crud.update_world_user_role(
        session=session,
        world_user=member,
        role=role_in.role,
    )

    return WorldUserPublic(**updated_member.model_dump())


@router.delete("/{world_id}/members/{user_id}", response_model=Message)
def remove_world_member(
    *,
    session: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
    world: CurrentWorld,
    world_admin: WorldAdmin,  # Only admins can remove members
    user_id: UUID,
) -> Message:
    """Remove a member from a World.

    Only world admins and weave owners/admins can remove members.
    """
    member = world_crud.get_world_user(
        session=session,
        world_id=world.id,
        user_id=user_id,
    )

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not a member of this world",
        )

    world_crud.remove_world_user(session=session, world_user=member)

    return Message(message="Member removed successfully")
