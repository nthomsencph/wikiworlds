"""Utilities for working with PostgreSQL ltree paths.

Provides helper functions for managing hierarchical entry paths.
"""

from uuid import UUID


def build_path(parent_path: str | None, entry_id: UUID) -> str:
    """Build an ltree path for an entry.

    Args:
        parent_path: Path of the parent entry (None for root entries)
        entry_id: UUID of the current entry

    Returns:
        ltree path as string

    Examples:
        >>> build_path(None, uuid4())
        'a1b2c3d4_e5f6_7890_abcd_ef1234567890'

        >>> build_path('parent_uuid', uuid4())
        'parent_uuid.child_uuid'
    """
    # Convert UUID to ltree-compatible format (replace - with _)
    entry_path = str(entry_id).replace("-", "_")

    if parent_path:
        return f"{parent_path}.{entry_path}"
    return entry_path


def get_parent_path(path: str) -> str | None:
    """Extract parent path from an ltree path.

    Args:
        path: Full ltree path

    Returns:
        Parent path or None if this is a root entry

    Examples:
        >>> get_parent_path('a.b.c')
        'a.b'

        >>> get_parent_path('root')
        None
    """
    parts = path.split(".")
    if len(parts) == 1:
        return None

    return ".".join(parts[:-1])


def get_depth(path: str) -> int:
    """Get the depth of an entry in the tree.

    Args:
        path: ltree path

    Returns:
        Depth (0 for root entries)

    Examples:
        >>> get_depth('root')
        0

        >>> get_depth('a.b.c')
        2
    """
    return len(path.split(".")) - 1


def is_descendant_of(child_path: str, parent_path: str) -> bool:
    """Check if a path is a descendant of another path.

    Args:
        child_path: Path to check
        parent_path: Potential parent path

    Returns:
        True if child_path is a descendant of parent_path

    Examples:
        >>> is_descendant_of('a.b.c', 'a.b')
        True

        >>> is_descendant_of('a.b', 'a.b.c')
        False
    """
    return child_path.startswith(parent_path + ".")


def get_root_path(path: str) -> str:
    """Get the root entry path from any path.

    Args:
        path: ltree path

    Returns:
        Root path (first component)

    Examples:
        >>> get_root_path('a.b.c')
        'a'
    """
    return path.split(".")[0]
