"""API routes for EntryType and FieldDefinition management."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.api.deps import CurrentUser, get_db
from app.api.deps_worldbuilding import CurrentWorld, WorldEditor
from app.db.crud import entry_type as entry_type_crud
from app.models.base import Message
from app.models.schemas.entry_type import (
    EntryTypeCreate,
    EntryTypePublic,
    EntryTypesPublic,
    EntryTypeUpdate,
    FieldDefinitionCreate,
    FieldDefinitionPublic,
    FieldDefinitionsPublic,
    FieldDefinitionUpdate,
    FieldReorderRequest,
)

router = APIRouter()


# --- EntryType Routes ---


@router.post("/", response_model=EntryTypePublic, status_code=status.HTTP_201_CREATED)
def create_entry_type(
    *,
    session: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
    world: CurrentWorld,
    _: WorldEditor,  # Only editors can create types
    entry_type_in: EntryTypeCreate,
) -> EntryTypePublic:
    """Create a new EntryType in a World."""
    # Check if slug is already taken
    existing = entry_type_crud.get_entry_type_by_slug(
        session=session,
        world_id=world.id,
        slug=entry_type_in.slug,
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An entry type with this slug already exists in this world",
        )

    entry_type = entry_type_crud.create_entry_type(
        session=session,
        entry_type_create=entry_type_in.model_dump(),
        world_id=world.id,
        user_id=current_user.id,
    )

    return EntryTypePublic(**entry_type.model_dump())


@router.get("/", response_model=EntryTypesPublic)
def list_entry_types(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    skip: int = 0,
    limit: int = 100,
) -> EntryTypesPublic:
    """Get all EntryTypes in a World."""
    entry_types = entry_type_crud.get_world_entry_types(
        session=session,
        world_id=world.id,
        skip=skip,
        limit=limit,
    )

    return EntryTypesPublic(
        data=[EntryTypePublic(**et.model_dump()) for et in entry_types],
        count=len(entry_types),
    )


@router.get("/{entry_type_id}", response_model=EntryTypePublic)
def get_entry_type(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    entry_type_id: UUID,
) -> EntryTypePublic:
    """Get a specific EntryType by ID."""
    entry_type = entry_type_crud.get_entry_type(
        session=session, entry_type_id=entry_type_id
    )

    if not entry_type or entry_type.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry type not found",
        )

    return EntryTypePublic(**entry_type.model_dump())


@router.patch("/{entry_type_id}", response_model=EntryTypePublic)
def update_entry_type(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    _: WorldEditor,  # Only editors can update types
    entry_type_id: UUID,
    entry_type_in: EntryTypeUpdate,
) -> EntryTypePublic:
    """Update an EntryType."""
    entry_type = entry_type_crud.get_entry_type(
        session=session, entry_type_id=entry_type_id
    )

    if not entry_type or entry_type.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry type not found",
        )

    updated_entry_type = entry_type_crud.update_entry_type(
        session=session,
        entry_type=entry_type,
        entry_type_update=entry_type_in.model_dump(exclude_unset=True),
    )

    return EntryTypePublic(**updated_entry_type.model_dump())


@router.delete("/{entry_type_id}", response_model=Message)
def delete_entry_type(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    _: WorldEditor,  # Only editors can delete types
    entry_type_id: UUID,
) -> Message:
    """Delete an EntryType (soft delete).

    This will not delete entries of this type, but will prevent new entries from being created.
    """
    entry_type = entry_type_crud.get_entry_type(
        session=session, entry_type_id=entry_type_id
    )

    if not entry_type or entry_type.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry type not found",
        )

    entry_type_crud.delete_entry_type(session=session, entry_type=entry_type)

    return Message(message="Entry type deleted successfully")


# --- FieldDefinition Routes ---


@router.get("/{entry_type_id}/fields", response_model=FieldDefinitionsPublic)
def list_fields(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    entry_type_id: UUID,
) -> FieldDefinitionsPublic:
    """Get all field definitions for an EntryType."""
    entry_type = entry_type_crud.get_entry_type(
        session=session, entry_type_id=entry_type_id
    )

    if not entry_type or entry_type.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry type not found",
        )

    fields = entry_type_crud.get_entry_type_fields(
        session=session,
        entry_type_id=entry_type_id,
    )

    return FieldDefinitionsPublic(
        data=[FieldDefinitionPublic(**field.model_dump()) for field in fields],
        count=len(fields),
    )


@router.post(
    "/{entry_type_id}/fields",
    response_model=FieldDefinitionPublic,
    status_code=status.HTTP_201_CREATED,
)
def create_field(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    _: WorldEditor,  # Only editors can create fields
    entry_type_id: UUID,
    field_in: FieldDefinitionCreate,
) -> FieldDefinitionPublic:
    """Create a new field definition for an EntryType."""
    entry_type = entry_type_crud.get_entry_type(
        session=session, entry_type_id=entry_type_id
    )

    if not entry_type or entry_type.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry type not found",
        )

    field = entry_type_crud.create_field_definition(
        session=session,
        field_definition_create=field_in.model_dump(),
        entry_type_id=entry_type_id,
    )

    return FieldDefinitionPublic(**field.model_dump())


@router.patch(
    "/{entry_type_id}/fields/{field_id}", response_model=FieldDefinitionPublic
)
def update_field(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,  # noqa # type: ignore
    _: WorldEditor,  # Only editors can update fields
    entry_type_id: UUID,
    field_id: UUID,
    field_in: FieldDefinitionUpdate,
) -> FieldDefinitionPublic:
    """Update a field definition."""
    field = entry_type_crud.get_field_definition(
        session=session, field_definition_id=field_id
    )

    if not field or field.entry_type_id != entry_type_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field definition not found",
        )

    updated_field = entry_type_crud.update_field_definition(
        session=session,
        field_definition=field,
        field_definition_update=field_in.model_dump(exclude_unset=True),
    )

    return FieldDefinitionPublic(**updated_field.model_dump())


@router.delete("/{entry_type_id}/fields/{field_id}", response_model=Message)
def delete_field(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,  # noqa # type: ignore
    _: WorldEditor,  # Only editors can delete fields
    entry_type_id: UUID,
    field_id: UUID,
) -> Message:
    """Delete a field definition.

    Warning: This will also delete all field values for this field across all entries.
    """
    field = entry_type_crud.get_field_definition(
        session=session, field_definition_id=field_id
    )

    if not field or field.entry_type_id != entry_type_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field definition not found",
        )

    entry_type_crud.delete_field_definition(session=session, field_definition=field)

    return Message(message="Field definition deleted successfully")


@router.post("/{entry_type_id}/fields/reorder", response_model=FieldDefinitionsPublic)
def reorder_fields(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    _: WorldEditor,  # Only editors can reorder fields
    entry_type_id: UUID,
    reorder_in: FieldReorderRequest,
) -> FieldDefinitionsPublic:
    """Reorder field definitions."""
    entry_type = entry_type_crud.get_entry_type(
        session=session, entry_type_id=entry_type_id
    )

    if not entry_type or entry_type.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry type not found",
        )

    fields = entry_type_crud.reorder_fields(
        session=session,
        entry_type_id=entry_type_id,
        field_positions=reorder_in.field_positions,
    )

    return FieldDefinitionsPublic(
        data=[FieldDefinitionPublic(**field.model_dump()) for field in fields],
        count=len(fields),
    )
