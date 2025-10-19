"""API routes for Entry management with temporal and hierarchy support."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, col, select

from app.api.deps import CurrentUser, get_db
from app.api.deps_worldbuilding import CurrentWorld, WorldEditor
from app.db.crud import entry as entry_crud
from app.db.crud import tag as tag_crud
from app.models.base import Message
from app.models.entry import EntryType
from app.models.schemas.entry import (
    BulkFieldValues,
    EntriesPublic,
    EntryCreate,
    EntryMove,
    EntryPublic,
    EntryWithFields,
    FieldValueCreate,
    FieldValuePublic,
    FieldValuesPublic,
)

router = APIRouter()


# --- Entry Routes ---


@router.post("/", response_model=EntryPublic, status_code=status.HTTP_201_CREATED)
def create_entry(
    *,
    session: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
    world: CurrentWorld,
    _: WorldEditor,  # Only editors can create entries
    entry_in: EntryCreate,
) -> EntryPublic:
    """Create a new Entry in a World."""
    # Check if slug is already taken
    existing = entry_crud.get_entry_by_slug(
        session=session,
        world_id=world.id,
        slug=entry_in.slug,
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An entry with this slug already exists in this world",
        )

    entry = entry_crud.create_entry(
        session=session,
        entry_create=entry_in.model_dump(
            exclude={"entry_type_id", "parent_id", "tags"}
        ),
        world_id=world.id,
        entry_type_id=entry_in.entry_type_id,
        user_id=current_user.id,
        parent_id=entry_in.parent_id,
    )

    # Handle tags
    if entry_in.tags:
        from app.models.reference import EntryTag

        for tag_name in entry_in.tags:
            tag_name = tag_name.strip()
            if not tag_name:
                continue

            # Generate slug from tag name
            tag_slug = tag_name.lower().replace(" ", "-").replace("_", "-")

            # Check if tag already exists
            tag = tag_crud.get_tag_by_slug(
                session=session, world_id=world.id, slug=tag_slug
            )

            # Create tag if it doesn't exist
            if not tag:
                tag = tag_crud.create_tag(
                    session=session,
                    tag_create={"name": tag_name, "slug": tag_slug},
                    world_id=world.id,
                    user_id=current_user.id,
                )

            # Link tag to entry
            entry_tag = EntryTag(
                entry_id=entry.id, tag_id=tag.id, created_by=current_user.id
            )
            session.add(entry_tag)

        session.commit()

    # Get tags for response
    tags = tag_crud.get_entry_tags(session=session, entry_id=entry.id)
    tag_names = [tag.name for tag in tags]

    return EntryPublic(**entry.model_dump(), tags=tag_names)


@router.get("/", response_model=EntriesPublic)
def list_entries(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    entry_type_id: UUID | None = None,
    timeline_year: int | None = Query(None, description="Filter by timeline year"),
    skip: int = 0,
    limit: int = 100,
) -> EntriesPublic:
    """Get all Entries in a World with optional filtering.

    Query parameters:
    - entry_type_id: Filter by entry type
    - timeline_year: Show only entries that existed in this year
    - skip: Pagination offset
    - limit: Pagination limit
    """
    entries = entry_crud.get_world_entries(
        session=session,
        world_id=world.id,
        entry_type_id=entry_type_id,
        timeline_year=timeline_year,
        skip=skip,
        limit=limit,
    )

    # Populate entry_type_name for each entry
    entry_type_map = {}
    if entries:
        entry_type_ids = {entry.entry_type_id for entry in entries}
        statement = select(EntryType).where(col(EntryType.id).in_(entry_type_ids))
        entry_types = session.exec(statement).all()
        entry_type_map = {et.id: et.name for et in entry_types}

    # Calculate character counts for each entry
    character_count_map = {}
    if entries:
        entry_ids = {entry.id for entry in entries}
        character_count_map = entry_crud.get_entry_character_counts(
            session=session, entry_ids=entry_ids
        )

    # Get tags for each entry
    tags_map = {}
    if entries:
        entry_ids = {entry.id for entry in entries}
        tags_map = tag_crud.get_entries_tags_map(session=session, entry_ids=entry_ids)

    return EntriesPublic(
        data=[
            EntryPublic(
                **entry.model_dump(),
                entry_type_name=entry_type_map.get(entry.entry_type_id),
                character_count=character_count_map.get(entry.id, 0),
                tags=tags_map.get(entry.id, []),
            )
            for entry in entries
        ],
        count=len(entries),
    )


@router.get("/roots", response_model=EntriesPublic)
def list_root_entries(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    entry_type_id: UUID | None = None,
) -> EntriesPublic:
    """Get all root entries (no parent) in a World."""
    entries = entry_crud.get_root_entries(
        session=session,
        world_id=world.id,
        entry_type_id=entry_type_id,
    )

    return EntriesPublic(
        data=[EntryPublic(**entry.model_dump()) for entry in entries],
        count=len(entries),
    )


@router.get("/{entry_id}", response_model=EntryWithFields)
def get_entry(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    entry_id: UUID,
    timeline_year: int | None = Query(
        None, description="Get field values at this year"
    ),
) -> EntryWithFields:
    """Get a specific Entry by ID with its field values."""
    entry = entry_crud.get_entry(session=session, entry_id=entry_id)

    if not entry or entry.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )

    # Get field values
    field_values = entry_crud.get_field_values(
        session=session,
        entry_id=entry_id,
        timeline_year=timeline_year,
    )

    # Convert to dict mapping field_definition_id to value
    fields_dict = {fv.field_definition_id: fv.value for fv in field_values}

    return EntryWithFields(**entry.model_dump(), field_values=fields_dict)


@router.patch("/{entry_id}", response_model=EntryPublic)
def update_entry(
    *,
    session: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
    world: CurrentWorld,
    _: WorldEditor,  # Only editors can update entries
    entry_id: UUID,
    entry_in: EntryCreate,
) -> EntryPublic:
    """Update an Entry."""
    entry = entry_crud.get_entry(session=session, entry_id=entry_id)

    if not entry or entry.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )

    updated_entry = entry_crud.update_entry(
        session=session,
        entry=entry,
        entry_update=entry_in.model_dump(exclude_unset=True),
        user_id=current_user.id,
    )

    return EntryPublic(**updated_entry.model_dump())


@router.post("/{entry_id}/move", response_model=EntryPublic)
def move_entry(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    _: WorldEditor,  # Only editors can move entries
    entry_id: UUID,
    move_in: EntryMove,
) -> EntryPublic:
    """Move an entry to a new parent or to root."""
    entry = entry_crud.get_entry(session=session, entry_id=entry_id)

    if not entry or entry.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )

    try:
        updated_entry = entry_crud.move_entry(
            session=session,
            entry=entry,
            new_parent_id=move_in.new_parent_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return EntryPublic(**updated_entry.model_dump())


@router.delete("/{entry_id}", response_model=Message)
def delete_entry(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    _: WorldEditor,  # Only editors can delete entries
    entry_id: UUID,
    recursive: bool = Query(False, description="Also delete all descendants"),
) -> Message:
    """Delete an Entry (soft delete).

    By default, only deletes the entry itself. Use recursive=true to delete all descendants.
    """
    entry = entry_crud.get_entry(session=session, entry_id=entry_id)

    if not entry or entry.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )

    entry_crud.delete_entry(session=session, entry=entry, recursive=recursive)

    return Message(message="Entry deleted successfully")


# --- Hierarchy Routes ---


@router.get("/{entry_id}/children", response_model=EntriesPublic)
def get_children(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    entry_id: UUID,
    recursive: bool = Query(
        False, description="Get all descendants, not just direct children"
    ),
) -> EntriesPublic:
    """Get child entries of a parent."""
    entry = entry_crud.get_entry(session=session, entry_id=entry_id)

    if not entry or entry.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )

    children = entry_crud.get_children(
        session=session,
        parent_id=entry_id,
        recursive=recursive,
    )

    return EntriesPublic(
        data=[EntryPublic(**child.model_dump()) for child in children],
        count=len(children),
    )


@router.get("/{entry_id}/ancestors", response_model=EntriesPublic)
def get_ancestors(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    entry_id: UUID,
) -> EntriesPublic:
    """Get ancestor entries (breadcrumb trail from root to parent)."""
    entry = entry_crud.get_entry(session=session, entry_id=entry_id)

    if not entry or entry.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )

    ancestors = entry_crud.get_ancestors(session=session, entry_id=entry_id)

    return EntriesPublic(
        data=[EntryPublic(**ancestor.model_dump()) for ancestor in ancestors],
        count=len(ancestors),
    )


# --- Field Value Routes ---


@router.get("/{entry_id}/fields", response_model=FieldValuesPublic)
def get_field_values(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    entry_id: UUID,
    timeline_year: int | None = Query(None, description="Get values at this year"),
) -> FieldValuesPublic:
    """Get all field values for an entry."""
    entry = entry_crud.get_entry(session=session, entry_id=entry_id)

    if not entry or entry.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )

    field_values = entry_crud.get_field_values(
        session=session,
        entry_id=entry_id,
        timeline_year=timeline_year,
    )

    return FieldValuesPublic(
        data=[FieldValuePublic(**fv.model_dump()) for fv in field_values],
        count=len(field_values),
    )


@router.post(
    "/{entry_id}/fields",
    response_model=FieldValuePublic,
    status_code=status.HTTP_201_CREATED,
)
def set_field_value(
    *,
    session: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
    world: CurrentWorld,
    _: WorldEditor,  # Only editors can set field values
    entry_id: UUID,
    field_value_in: FieldValueCreate,
) -> FieldValuePublic:
    """Set a field value for an entry.

    For temporal fields, this creates a new value for the specified time period.
    For non-temporal fields, this updates the existing value.
    """
    entry = entry_crud.get_entry(session=session, entry_id=entry_id)

    if not entry or entry.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )

    field_value = entry_crud.set_field_value(
        session=session,
        entry_id=entry_id,
        field_definition_id=field_value_in.field_definition_id,
        value=field_value_in.value,
        user_id=current_user.id,
        timeline_start_year=field_value_in.timeline_start_year,
        timeline_end_year=field_value_in.timeline_end_year,
        timeline_is_circa=field_value_in.timeline_is_circa,
        timeline_is_ongoing=field_value_in.timeline_is_ongoing,
    )

    return FieldValuePublic(**field_value.model_dump())


@router.post("/{entry_id}/fields/bulk", response_model=FieldValuesPublic)
def set_field_values_bulk(
    *,
    session: Annotated[Session, Depends(get_db)],
    current_user: CurrentUser,
    world: CurrentWorld,
    _: WorldEditor,  # Only editors can set field values
    entry_id: UUID,
    bulk_in: BulkFieldValues,
) -> FieldValuesPublic:
    """Set multiple field values at once."""
    entry = entry_crud.get_entry(session=session, entry_id=entry_id)

    if not entry or entry.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )

    field_values = []
    for field_value_in in bulk_in.field_values:
        field_value = entry_crud.set_field_value(
            session=session,
            entry_id=entry_id,
            field_definition_id=field_value_in.field_definition_id,
            value=field_value_in.value,
            user_id=current_user.id,
            timeline_start_year=field_value_in.timeline_start_year,
            timeline_end_year=field_value_in.timeline_end_year,
            timeline_is_circa=field_value_in.timeline_is_circa,
            timeline_is_ongoing=field_value_in.timeline_is_ongoing,
        )
        field_values.append(field_value)

    return FieldValuesPublic(
        data=[FieldValuePublic(**fv.model_dump()) for fv in field_values],
        count=len(field_values),
    )


@router.get(
    "/{entry_id}/fields/{field_definition_id}/history",
    response_model=FieldValuesPublic,
)
def get_field_value_history(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    entry_id: UUID,
    field_definition_id: UUID,
) -> FieldValuesPublic:
    """Get all historical values for a specific field (temporal history)."""
    entry = entry_crud.get_entry(session=session, entry_id=entry_id)

    if not entry or entry.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )

    field_values = entry_crud.get_field_value_history(
        session=session,
        entry_id=entry_id,
        field_definition_id=field_definition_id,
    )

    return FieldValuesPublic(
        data=[FieldValuePublic(**fv.model_dump()) for fv in field_values],
        count=len(field_values),
    )


@router.delete("/{entry_id}/fields/{field_value_id}", response_model=Message)
def delete_field_value(
    *,
    session: Annotated[Session, Depends(get_db)],
    world: CurrentWorld,
    _: WorldEditor,  # Only editors can delete field values
    entry_id: UUID,
    field_value_id: UUID,
) -> Message:
    """Delete a specific field value (useful for temporal field values)."""
    entry = entry_crud.get_entry(session=session, entry_id=entry_id)

    if not entry or entry.world_id != world.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )

    from app.models.entry import FieldValue

    field_value = session.get(FieldValue, field_value_id)

    if not field_value or field_value.entry_id != entry_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field value not found",
        )

    entry_crud.delete_field_value(session=session, field_value=field_value)

    return Message(message="Field value deleted successfully")
