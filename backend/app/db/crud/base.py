"""
Base CRUD operations that can be inherited by specific CRUD classes.
This provides a foundation for consistent CRUD patterns across all entities.
"""
import uuid
from typing import Any, Generic, TypeVar

from pydantic import BaseModel
from sqlmodel import Session, SQLModel, select

# Generic types for the CRUD base class
ModelType = TypeVar("ModelType", bound=SQLModel)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Base class for CRUD operations.

    This can be used as a foundation for entity-specific CRUD classes
    when we expand the application for AI Maturity Assessment.
    """

    def __init__(self, model: type[ModelType]):
        """
        CRUD object with default methods to Create, Read, Update, Delete (CRUD).

        **Parameters**
        * `model`: A SQLModel model class
        * `schema`: A Pydantic model (schema) class
        """
        self.model = model

    def get(self, session: Session, id: uuid.UUID | str | int) -> ModelType | None:
        """Get a single record by ID."""
        return session.get(self.model, id)

    def get_multi(
        self, session: Session, *, skip: int = 0, limit: int = 100
    ) -> list[ModelType]:
        """Get multiple records with pagination."""
        statement = select(self.model).offset(skip).limit(limit)
        return list(session.exec(statement).all())

    def create(self, session: Session, *, obj_in: CreateSchemaType) -> ModelType:
        """Create a new record."""
        db_obj = self.model.model_validate(obj_in)
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj

    def update(
        self,
        session: Session,
        *,
        db_obj: ModelType,
        obj_in: UpdateSchemaType | dict[str, Any],
    ) -> ModelType:
        """Update an existing record."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        db_obj.sqlmodel_update(update_data)
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj

    def remove(
        self, session: Session, *, id: uuid.UUID | str | int
    ) -> ModelType | None:
        """Delete a record by ID."""
        obj = session.get(self.model, id)
        if obj:
            session.delete(obj)
            session.commit()
        return obj
