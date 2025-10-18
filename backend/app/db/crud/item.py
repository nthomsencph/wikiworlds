"""
CRUD operations for Item model.
These are placeholder operations that will likely be replaced
with AI Maturity Assessment specific entities.
"""
import uuid

from sqlmodel import Session, select

from app.models import Item, ItemCreate, ItemUpdate


def create_item(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
    """Create a new item with owner."""
    db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


def get_item_by_id(*, session: Session, item_id: uuid.UUID) -> Item | None:
    """Get item by ID."""
    return session.get(Item, item_id)


def get_items(*, session: Session, skip: int = 0, limit: int = 100) -> list[Item]:
    """Get multiple items with pagination."""
    statement = select(Item).offset(skip).limit(limit)
    return list(session.exec(statement).all())


def get_items_by_owner(
    *, session: Session, owner_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[Item]:
    """Get items owned by a specific user."""
    statement = select(Item).where(Item.owner_id == owner_id).offset(skip).limit(limit)
    return list(session.exec(statement).all())


def update_item(*, session: Session, db_item: Item, item_in: ItemUpdate) -> Item:
    """Update item information."""
    update_data = item_in.model_dump(exclude_unset=True)
    db_item.sqlmodel_update(update_data)
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


def delete_item(*, session: Session, item_id: uuid.UUID) -> Item | None:
    """Delete item by ID."""
    item = session.get(Item, item_id)
    if item:
        session.delete(item)
        session.commit()
    return item
