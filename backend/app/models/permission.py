"""Attribute-Based Access Control (ABAC) for flexible permissions.

Supports granular, conditional permissions at multiple levels.
"""

from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlmodel import Column, Field, Index, JSON, SQLModel


class Permission(SQLModel, table=True):
    """Granular permission with conditions.

    Implements Attribute-Based Access Control for maximum flexibility.
    """

    __tablename__ = "permission"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Scope - permissions are scoped to Weave/World
    weave_id: UUID = Field(foreign_key="weave.id", index=True)
    world_id: UUID | None = Field(foreign_key="world.id", index=True)
    # If world_id is None, permission applies to weave-level resources

    # --- WHAT (Resource) ---
    resource_type: (
        str  # 'weave', 'world', 'entry', 'entry_type', 'block', 'comment', etc.
    )
    resource_id: UUID | None = None
    # If resource_id is None, applies to all resources of this type

    # --- WHO (Subject) ---
    subject_type: str  # 'user', 'team', 'role', 'public'
    subject_id: UUID | None = None
    # For 'user': user_id
    # For 'role': role name ('owner', 'admin', 'editor', 'viewer')
    # For 'public': None (applies to everyone)

    # --- ACTION ---
    action: str
    # Common actions:
    # - 'read', 'create', 'update', 'delete'
    # - 'comment', 'share', 'export'
    # - 'manage_permissions', 'invite_users'
    # Special: '*' = all actions

    # --- CONDITIONS (ABAC part) ---
    conditions: dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    # Examples:
    # {"entry_type": "character"} - only applies to character entries
    # {"created_by": "self"} - only own entries
    # {"field.status": "published"} - only published entries
    # {"timeline_year": {"min": 100, "max": 500}} - temporal condition

    # Permission effect
    effect: str = "allow"  # 'allow' or 'deny'
    # Deny rules override allow rules

    # Priority (higher number = higher priority)
    priority: int = 0
    # Used when multiple permissions conflict

    # Temporal validity (when this permission is active - real-world time)
    valid_from: datetime | None = None
    valid_until: datetime | None = None

    # Metadata
    name: str | None = None  # Optional name for the permission
    description: str | None = None

    granted_by: UUID = Field(foreign_key="user.id")
    granted_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: datetime | None = None

    __table_args__ = (
        Index("idx_permission_weave", "weave_id"),
        Index("idx_permission_world", "world_id"),
        Index("idx_permission_resource", "resource_type", "resource_id"),
        Index("idx_permission_subject", "subject_type", "subject_id"),
        Index("idx_permission_action", "action"),
        # Composite index for common queries
        Index(
            "idx_permission_lookup",
            "weave_id",
            "world_id",
            "subject_type",
            "subject_id",
            "resource_type",
        ),
    )


class Team(SQLModel, table=True):
    """Groups of users within a Weave for easier permission management."""

    __tablename__ = "team"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    weave_id: UUID = Field(foreign_key="weave.id", index=True)

    # Core fields
    name: str
    slug: str
    description: str | None = None

    # Display
    icon: str | None = None
    color: str | None = None

    # Metadata
    created_by: UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: datetime | None = None

    __table_args__ = (Index("idx_team_weave", "weave_id"),)


class TeamMember(SQLModel, table=True):
    """Membership in teams."""

    __tablename__ = "team_member"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    team_id: UUID = Field(foreign_key="team.id", index=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)

    # Role within the team (optional)
    role: str | None = None  # 'lead', 'member'

    # Metadata
    added_by: UUID = Field(foreign_key="user.id")
    added_at: datetime = Field(default_factory=datetime.utcnow)

    __table_args__ = (
        Index("idx_team_member_team", "team_id"),
        Index("idx_team_member_user", "user_id"),
    )


# Re-export for convenience
__all__ = [
    "Permission",
    "Team",
    "TeamMember",
]
