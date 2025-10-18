"""API routes for Block operations."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session

from app.api.deps import get_db
from app.api.deps_worldbuilding import CurrentUser, CurrentWorld, WorldEditor
from app.db.crud import block as block_crud
from app.models.schemas.block import (
    BlockCreate,
    BlockPublic,
    BlocksPublic,
    BlockUpdate,
    BulkBlocksCreate,
)

router = APIRouter()


@router.post("/", response_model=BlockPublic, status_code=status.HTTP_201_CREATED)
def create_block(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    world_editor: WorldEditor,
    current_user: CurrentUser,
    entry_id: UUID = Query(..., description="Entry ID to create block for"),
    block_in: BlockCreate,
) -> BlockPublic:
    """Create a new block for an entry."""
    # Verify the entry exists and belongs to this world
    from app.db.crud import entry as entry_crud

    entry = entry_crud.get_entry(session=session, entry_id=entry_id)
    if not entry or entry.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )

    block = block_crud.create_block(
        session=session,
        block_create=block_in.model_dump(exclude_unset=True),
        entry_id=entry_id,
        user_id=current_user.id,
    )

    return BlockPublic(**block.model_dump())


@router.post("/bulk", response_model=BlocksPublic, status_code=status.HTTP_201_CREATED)
def bulk_create_blocks(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    world_editor: WorldEditor,
    current_user: CurrentUser,
    entry_id: UUID = Query(..., description="Entry ID to create blocks for"),
    bulk_in: BulkBlocksCreate,
) -> BlocksPublic:
    """Create multiple blocks at once for an entry."""
    # Verify the entry exists and belongs to this world
    from app.db.crud import entry as entry_crud

    entry = entry_crud.get_entry(session=session, entry_id=entry_id)
    if not entry or entry.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )

    blocks_data = [block.model_dump(exclude_unset=True) for block in bulk_in.blocks]
    blocks = block_crud.bulk_create_blocks(
        session=session,
        blocks_data=blocks_data,
        entry_id=entry_id,
        user_id=current_user.id,
    )

    return BlocksPublic(
        data=[BlockPublic(**block.model_dump()) for block in blocks],
        count=len(blocks),
    )


@router.get("/", response_model=BlocksPublic)
def list_blocks(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    entry_id: UUID = Query(..., description="Entry ID to list blocks for"),
    timeline_year: int | None = Query(None, description="Filter by timeline year"),
) -> BlocksPublic:
    """Get all blocks for an entry.

    Query parameters:
    - entry_id: The entry to get blocks for
    - timeline_year: Optional year to filter blocks by temporal validity
    """
    # Verify the entry exists and belongs to this world
    from app.db.crud import entry as entry_crud

    entry = entry_crud.get_entry(session=session, entry_id=entry_id)
    if not entry or entry.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )

    blocks = block_crud.get_entry_blocks(
        session=session,
        entry_id=entry_id,
        timeline_year=timeline_year,
    )

    return BlocksPublic(
        data=[BlockPublic(**block.model_dump()) for block in blocks],
        count=len(blocks),
    )


@router.get("/{block_id}", response_model=BlockPublic)
def get_block(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    block_id: UUID,
) -> BlockPublic:
    """Get a specific block by ID."""
    block = block_crud.get_block(session=session, block_id=block_id)

    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Block not found",
        )

    # Verify the block's entry belongs to this world
    from app.db.crud import entry as entry_crud

    entry = entry_crud.get_entry(session=session, entry_id=block.entry_id)
    if not entry or entry.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Block not found",
        )

    return BlockPublic(**block.model_dump())


@router.patch("/{block_id}", response_model=BlockPublic)
def update_block(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    world_editor: WorldEditor,
    current_user: CurrentUser,
    block_id: UUID,
    block_in: BlockUpdate,
) -> BlockPublic:
    """Update a block."""
    block = block_crud.get_block(session=session, block_id=block_id)

    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Block not found",
        )

    # Verify the block's entry belongs to this world
    from app.db.crud import entry as entry_crud

    entry = entry_crud.get_entry(session=session, entry_id=block.entry_id)
    if not entry or entry.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Block not found",
        )

    updated_block = block_crud.update_block(
        session=session,
        block=block,
        block_update=block_in.model_dump(exclude_unset=True),
        user_id=current_user.id,
    )

    return BlockPublic(**updated_block.model_dump())


@router.delete("/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_block(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    world_editor: WorldEditor,
    block_id: UUID,
) -> None:
    """Delete a block."""
    block = block_crud.get_block(session=session, block_id=block_id)

    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Block not found",
        )

    # Verify the block's entry belongs to this world
    from app.db.crud import entry as entry_crud

    entry = entry_crud.get_entry(session=session, entry_id=block.entry_id)
    if not entry or entry.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Block not found",
        )

    block_crud.delete_block(session=session, block=block)
