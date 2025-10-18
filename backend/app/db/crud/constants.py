# Default entry types for worldbuilding
# Organized as a hierarchical structure with 4 top-level categories:
# 1. General (no subcategories)
# 2. Places (geographic/spatial entities)
# 3. People (characters, groups, organizations)
# 4. Concepts (abstract ideas, systems, culture)
#
# Note: All names are plural (e.g., "Places", "Regions") except "General"

DEFAULT_ENTRY_TYPES = [
    # =============================================================================
    # TOP-LEVEL: GENERAL
    # =============================================================================
    {
        "name": "General",
        "parent_name": None,
    },
    # =============================================================================
    # TOP-LEVEL: PLACES
    # =============================================================================
    {
        "name": "Places",
        "parent_name": None,
    },
    # Places > Regions
    {
        "name": "Regions",
        "parent_name": "Places",
    },
    # Places > Locations
    {
        "name": "Locations",
        "parent_name": "Places",
    },
    # Places > Natural Features
    {
        "name": "Natural Features",
        "parent_name": "Places",
    },
    # =============================================================================
    # TOP-LEVEL: PEOPLE
    # =============================================================================
    {
        "name": "People",
        "parent_name": None,
    },
    # People > Characters
    {
        "name": "Characters",
        "parent_name": "People",
    },
    # People > Groups
    {
        "name": "Groups",
        "parent_name": "People",
    },
    # People > Organizations
    {
        "name": "Organizations",
        "parent_name": "People",
    },
    # =============================================================================
    # TOP-LEVEL: CONCEPTS
    # =============================================================================
    {
        "name": "Concepts",
        "parent_name": None,
    },
    # Concepts > Culture
    {
        "name": "Culture",
        "parent_name": "Concepts",
    },
    # Concepts > Magic Systems
    {
        "name": "Magic Systems",
        "parent_name": "Concepts",
    },
    # Concepts > History
    {
        "name": "History",
        "parent_name": "Concepts",
    },
    # Concepts > Knowledge
    {
        "name": "Knowledge",
        "parent_name": "Concepts",
    },
]
