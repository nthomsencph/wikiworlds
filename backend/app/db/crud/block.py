"""CRUD operations for Block models."""

from typing import Any
from uuid import UUID

from sqlmodel import Session, col, select

from app.models.block import Block


def create_block(
    *,
    session: Session,
    block_create: dict[str, Any],
    entry_id: UUID,
    user_id: UUID,
) -> Block:
    """Create a new Block.

    Args:
        session: Database session
        block_create: Dictionary with block data
        entry_id: UUID of the entry
        user_id: UUID of the user creating the block

    Returns:
        Created Block object
    """
    block = Block(
        **block_create,
        entry_id=entry_id,
        created_by=user_id,
        updated_by=user_id,
    )
    session.add(block)
    session.commit()
    session.refresh(block)
    return block


def get_block(*, session: Session, block_id: UUID) -> Block | None:
    """Get a block by ID.

    Args:
        session: Database session
        block_id: UUID of the block

    Returns:
        Block object or None if not found
    """
    statement = (
        select(Block).where(Block.id == block_id).where(col(Block.deleted_at).is_(None))
    )
    return session.exec(statement).first()


def get_entry_blocks(
    *,
    session: Session,
    entry_id: UUID,
    timeline_year: int | None = None,
) -> list[Block]:
    """Get all blocks for an entry.

    Args:
        session: Database session
        entry_id: UUID of the entry
        timeline_year: Optional year to filter blocks by temporal validity

    Returns:
        List of Block objects
    """
    statement = (
        select(Block)
        .where(Block.entry_id == entry_id)
        .where(col(Block.deleted_at).is_(None))
        .order_by(col(Block.position))
    )

    if timeline_year is not None:
        # Filter blocks valid at the given year
        statement = statement.where(
            (col(Block.timeline_start_year).is_(None))
            | (col(Block.timeline_start_year) <= timeline_year)
        ).where(
            (col(Block.timeline_end_year).is_(None))
            | (col(Block.timeline_end_year) >= timeline_year)
        )

    return list(session.exec(statement).all())


def update_block(
    *,
    session: Session,
    block: Block,
    block_update: dict[str, Any],
    user_id: UUID,
) -> Block:
    """Update a block.

    Args:
        session: Database session
        block: Block object to update
        block_update: Dictionary with updated fields
        user_id: UUID of the user updating the block

    Returns:
        Updated Block object
    """
    for key, value in block_update.items():
        if value is not None:
            setattr(block, key, value)

    block.updated_by = user_id
    block.version += 1

    session.add(block)
    session.commit()
    session.refresh(block)
    return block


def delete_block(*, session: Session, block: Block) -> None:
    """Soft delete a block.

    Args:
        session: Database session
        block: Block object to delete
    """
    from datetime import datetime

    block.deleted_at = datetime.utcnow()
    session.add(block)
    session.commit()


def bulk_create_blocks(
    *,
    session: Session,
    blocks_data: list[dict[str, Any]],
    entry_id: UUID,
    user_id: UUID,
) -> list[Block]:
    """Create multiple blocks at once.

    Args:
        session: Database session
        blocks_data: List of dictionaries with block data
        entry_id: UUID of the entry
        user_id: UUID of the user creating the blocks

    Returns:
        List of created Block objects
    """
    blocks = []
    for block_data in blocks_data:
        block = Block(
            **block_data,
            entry_id=entry_id,
            created_by=user_id,
            updated_by=user_id,
        )
        session.add(block)
        blocks.append(block)

    session.commit()
    for block in blocks:
        session.refresh(block)

    return blocks
