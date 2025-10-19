"""API routes for Tag management."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.api.deps import CurrentUser, get_db
from app.api.deps_worldbuilding import CurrentWorld, WorldEditor
from app.db.crud import tag as tag_crud
from app.models.base import Message
from app.models.schemas.tag import (
    TagCreate,
    TagPublic,
    TagsPublic,
    TagUpdate,
)

router = APIRouter()


# --- Tag Routes ---


@router.post("/", response_model=TagPublic, status_code=status.HTTP_201_CREATED)
def create_tag(
    *,
    session: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
    world: CurrentWorld,
    _: WorldEditor,  # Only editors can create tags
    tag_in: TagCreate,
) -> TagPublic:
    """Create a new Tag in a World."""
    # Check if slug is already taken
    existing = tag_crud.get_tag_by_slug(
        session=session,
        world_id=world.id,
        slug=tag_in.slug,
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A tag with this slug already exists in this world",
        )

    tag = tag_crud.create_tag(
        session=session,
        tag_create=tag_in.model_dump(),
        world_id=world.id,
        user_id=current_user.id,
    )

    return TagPublic(**tag.model_dump())


@router.get("/", response_model=TagsPublic)
def list_tags(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    skip: int = 0,
    limit: int = 1000,
) -> TagsPublic:
    """Get all Tags in a World."""
    tags = tag_crud.get_world_tags(
        session=session,
        world_id=world.id,
        skip=skip,
        limit=limit,
    )

    return TagsPublic(
        data=[TagPublic(**tag.model_dump()) for tag in tags],
        count=len(tags),
    )


@router.get("/{tag_id}", response_model=TagPublic)
def get_tag(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    tag_id: UUID,
) -> TagPublic:
    """Get a specific Tag by ID."""
    tag = tag_crud.get_tag(session=session, tag_id=tag_id)

    if not tag or tag.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )

    return TagPublic(**tag.model_dump())


@router.patch("/{tag_id}", response_model=TagPublic)
def update_tag(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    _: WorldEditor,  # Only editors can update tags
    tag_id: UUID,
    tag_in: TagUpdate,
) -> TagPublic:
    """Update a Tag."""
    tag = tag_crud.get_tag(session=session, tag_id=tag_id)

    if not tag or tag.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )

    updated_tag = tag_crud.update_tag(
        session=session,
        tag=tag,
        tag_update=tag_in.model_dump(exclude_unset=True),
    )

    return TagPublic(**updated_tag.model_dump())


@router.delete("/{tag_id}", response_model=Message)
def delete_tag(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    _: WorldEditor,  # Only editors can delete tags
    tag_id: UUID,
) -> Message:
    """Delete a Tag (soft delete).

    This will also remove this tag from all entries.
    """
    tag = tag_crud.get_tag(session=session, tag_id=tag_id)

    if not tag or tag.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )

    tag_crud.delete_tag(session=session, tag=tag)

    return Message(message="Tag deleted successfully")
