"""API routes for Weave management."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.api.deps import CurrentUser, get_db
from app.api.deps_worldbuilding import (
    CurrentWeave,
    CurrentWeaveUser,
    WeaveAdmin,
    WeaveOwner,
)
from app.db.crud import weave as weave_crud
from app.models.base import Message
from app.models.schemas.weave import (
    WeaveCreate,
    WeavePublic,
    WeavesPublic,
    WeaveUpdate,
    WeaveUserCreate,
    WeaveUserPublic,
    WeaveUserUpdate,
)

router = APIRouter()


@router.post("/", response_model=WeavePublic, status_code=status.HTTP_201_CREATED)
def create_weave(
    *,
    session: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
    weave_in: WeaveCreate,
) -> WeavePublic:
    """Create a new Weave.

    The current user will be added as the owner.
    """
    # Check if slug is already taken
    existing = weave_crud.get_weave_by_slug(session=session, slug=weave_in.slug)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A weave with this slug already exists",
        )

    weave = weave_crud.create_weave(
        session=session,
        weave_create=weave_in.model_dump(),
        user_id=current_user.id,
    )

    return WeavePublic(**weave.model_dump(), user_role="owner")


@router.get("/", response_model=WeavesPublic)
def list_my_weaves(
    *,
    session: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> WeavesPublic:
    """Get all Weaves the current user has access to."""
    weaves = weave_crud.get_user_weaves(
        session=session,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )

    # Fetch roles for each weave
    weaves_with_roles = []
    for weave in weaves:
        weave_user = weave_crud.get_weave_user(
            session=session,
            weave_id=weave.id,
            user_id=current_user.id,
        )
        weaves_with_roles.append(
            WeavePublic(**weave.model_dump(), user_role=weave_user.role if weave_user else None)
        )

    return WeavesPublic(data=weaves_with_roles, count=len(weaves_with_roles))


@router.get("/{weave_id}", response_model=WeavePublic)
def get_weave(
    *,
    weave: CurrentWeave,
    weave_user: CurrentWeaveUser,
) -> WeavePublic:
    """Get a specific Weave by ID."""
    return WeavePublic(**weave.model_dump(), user_role=weave_user.role)


@router.patch("/{weave_id}", response_model=WeavePublic)
def update_weave(
    *,
    session: Annotated[Session, Depends(get_db)],
    weave: CurrentWeave,
    weave_user: WeaveAdmin,  # Only owners and admins can update
    weave_in: WeaveUpdate,
) -> WeavePublic:
    """Update a Weave.

    Only weave owners and admins can update weave settings.
    """
    updated_weave = weave_crud.update_weave(
        session=session,
        weave=weave,
        weave_update=weave_in.model_dump(exclude_unset=True),
    )

    return WeavePublic(**updated_weave.model_dump(), user_role=weave_user.role)


@router.delete("/{weave_id}", response_model=Message)
def delete_weave(
    *,
    session: Annotated[Session, Depends(get_db)],
    weave: CurrentWeave,
    weave_user: WeaveOwner,  # Only owners can delete
) -> Message:
    """Delete a Weave (soft delete).

    Only weave owners can delete the weave. This will also soft delete
    all worlds within the weave.
    """
    weave_crud.delete_weave(session=session, weave=weave)

    return Message(message="Weave deleted successfully")


# --- Weave Members Management ---


@router.get("/{weave_id}/members", response_model=list[WeaveUserPublic])
def list_weave_members(
    *,
    session: Annotated[Session, Depends(get_db)],
    weave: CurrentWeave,
    weave_user: CurrentWeaveUser,  # Must be a member to view members
) -> list[WeaveUserPublic]:
    """Get all members of a Weave."""
    members = weave_crud.get_weave_members(session=session, weave_id=weave.id)

    # TODO: Join with User table to get user details
    return [WeaveUserPublic(**member.model_dump()) for member in members]


@router.post("/{weave_id}/members", response_model=WeaveUserPublic, status_code=status.HTTP_201_CREATED)
def add_weave_member(
    *,
    session: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
    weave: CurrentWeave,
    weave_user: WeaveAdmin,  # Only admins can invite members
    member_in: WeaveUserCreate,
) -> WeaveUserPublic:
    """Add a new member to a Weave.

    Only weave owners and admins can invite new members.
    """
    # Check if user is already a member
    existing = weave_crud.get_weave_user(
        session=session,
        weave_id=weave.id,
        user_id=member_in.user_id,
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this weave",
        )

    new_member = weave_crud.add_weave_user(
        session=session,
        weave_id=weave.id,
        user_id=member_in.user_id,
        role=member_in.role,
        invited_by=current_user.id,
    )

    return WeaveUserPublic(**new_member.model_dump())


@router.patch("/{weave_id}/members/{user_id}", response_model=WeaveUserPublic)
def update_member_role(
    *,
    session: Annotated[Session, Depends(get_db)],
    weave: CurrentWeave,
    weave_admin: WeaveAdmin,  # Only admins can change roles
    user_id: UUID,
    role_in: WeaveUserUpdate,
) -> WeaveUserPublic:
    """Update a member's role in a Weave.

    Only weave owners and admins can update member roles.
    """
    member = weave_crud.get_weave_user(
        session=session,
        weave_id=weave.id,
        user_id=user_id,
    )

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not a member of this weave",
        )

    # Only owners can change owner role
    if role_in.role == "owner" and weave_admin.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only weave owners can assign the owner role",
        )

    updated_member = weave_crud.update_weave_user_role(
        session=session,
        weave_user=member,
        role=role_in.role,
    )

    return WeaveUserPublic(**updated_member.model_dump())


@router.delete("/{weave_id}/members/{user_id}", response_model=Message)
def remove_weave_member(
    *,
    session: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
    weave: CurrentWeave,
    weave_admin: WeaveAdmin,  # Only admins can remove members
    user_id: UUID,
) -> Message:
    """Remove a member from a Weave.

    Only weave owners and admins can remove members.
    Users cannot remove the last owner.
    """
    member = weave_crud.get_weave_user(
        session=session,
        weave_id=weave.id,
        user_id=user_id,
    )

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not a member of this weave",
        )

    # Check if this is the last owner
    if member.role == "owner":
        all_members = weave_crud.get_weave_members(session=session, weave_id=weave.id)
        owner_count = sum(1 for m in all_members if m.role == "owner")

        if owner_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the last owner from the weave",
            )

    weave_crud.remove_weave_user(session=session, weave_user=member)

    return Message(message="Member removed successfully")
