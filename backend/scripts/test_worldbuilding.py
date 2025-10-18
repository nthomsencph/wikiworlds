#!/usr/bin/env python3
"""
Test script for worldbuilding system.

This script tests the complete worldbuilding workflow:
1. Create a Weave (multi-tenant container)
2. Create a World within the Weave
3. Create EntryTypes with custom fields
4. Create Entries with temporal validity
5. Set field values with temporal ranges
6. Test hierarchy navigation
7. Test temporal filtering
"""

import requests
from datetime import datetime
from typing import Any
import sys

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
TEST_USER_EMAIL = "admin@changethis.com"
TEST_USER_PASSWORD = "changethis"


def print_section(title: str):
    """Print a formatted section header."""
    print(f"\n{'=' * 80}")
    print(f"  {title}")
    print(f"{'=' * 80}\n")


def print_success(message: str):
    """Print a success message."""
    print(f"✓ {message}")


def print_error(message: str):
    """Print an error message."""
    print(f"✗ {message}")


def login() -> str:
    """Login and return access token."""
    print_section("1. Login")

    response = requests.post(
        f"{BASE_URL}/login/access-token",
        data={
            "username": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
        },
    )

    if response.status_code != 200:
        print_error(f"Login failed: {response.status_code} - {response.text}")
        sys.exit(1)

    token = response.json()["access_token"]
    print_success(f"Logged in as {TEST_USER_EMAIL}")
    return token


def create_weave(token: str) -> dict[str, Any]:
    """Create a new Weave."""
    print_section("2. Create Weave")

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    weave_data = {
        "name": "Middle Earth",
        "slug": f"middle-earth-{timestamp}",
        "description": "Tolkien's fantasy universe"
    }

    response = requests.post(
        f"{BASE_URL}/weaves/",
        json=weave_data,
        headers={"Authorization": f"Bearer {token}"},
    )

    if response.status_code != 201:
        print_error(f"Failed to create weave: {response.status_code} - {response.text}")
        sys.exit(1)

    weave = response.json()
    print_success(f"Created Weave: {weave['name']} (ID: {weave['id']})")
    return weave


def create_world(token: str, weave_id: str) -> dict[str, Any]:
    """Create a new World within a Weave."""
    print_section("3. Create World")

    world_data = {
        "name": "Arda",
        "slug": "arda",
        "description": "The world where Middle Earth exists",
        "is_public": True
    }

    response = requests.post(
        f"{BASE_URL}/weaves/{weave_id}/worlds/",
        json=world_data,
        headers={"Authorization": f"Bearer {token}"},
    )

    if response.status_code != 201:
        print_error(f"Failed to create world: {response.status_code} - {response.text}")
        sys.exit(1)

    world = response.json()
    print_success(f"Created World: {world['name']} (ID: {world['id']})")
    return world


def create_entry_type(token: str, weave_id: str, world_id: str) -> dict[str, Any]:
    """Create an EntryType with custom fields."""
    print_section("4. Create Entry Type: Character")

    entry_type_data = {
        "name": "Character",
        "plural_name": "Characters",
        "slug": "character",
        "description": "A person or being in the world",
        "icon": "👤",
        "color": "#3B82F6"
    }

    response = requests.post(
        f"{BASE_URL}/weaves/{weave_id}/worlds/{world_id}/entry-types/",
        json=entry_type_data,
        headers={"Authorization": f"Bearer {token}"},
    )

    if response.status_code != 201:
        print_error(f"Failed to create entry type: {response.status_code} - {response.text}")
        sys.exit(1)

    entry_type = response.json()
    print_success(f"Created EntryType: {entry_type['name']} (ID: {entry_type['id']})")

    # Create custom fields
    print("\n  Creating custom fields:")

    fields = [
        {
            "name": "Race",
            "slug": "race",
            "field_type": "text",
            "description": "The character's race (e.g., Elf, Human, Dwarf)",
            "is_temporal": False,
        },
        {
            "name": "Title",
            "slug": "title",
            "field_type": "text",
            "description": "The character's title or position",
            "is_temporal": True,  # Titles can change over time!
        },
        {
            "name": "Status",
            "slug": "status",
            "field_type": "text",
            "description": "Living status",
            "is_temporal": True,
        },
    ]

    for field_data in fields:
        response = requests.post(
            f"{BASE_URL}/weaves/{weave_id}/worlds/{world_id}/entry-types/{entry_type['id']}/fields",
            json=field_data,
            headers={"Authorization": f"Bearer {token}"},
        )

        if response.status_code != 201:
            print_error(f"  Failed to create field '{field_data['name']}': {response.status_code} - {response.text}")
            continue

        field = response.json()
        print_success(f"  Created field: {field['name']} (temporal: {field['is_temporal']})")

    return entry_type


def create_entries(token: str, weave_id: str, world_id: str, entry_type_id: str) -> list[dict[str, Any]]:
    """Create entries with temporal validity."""
    print_section("5. Create Entries with Temporal Validity")

    entries_data = [
        {
            "title": "Aragorn",
            "slug": "aragorn",
            "entry_type_id": entry_type_id,
            "timeline_start_year": 2931,  # Birth in Third Age
            "timeline_end_year": 120,      # Death in Fourth Age
            "timeline_is_circa": False,
            "timeline_is_ongoing": False,
        },
        {
            "title": "Gandalf",
            "slug": "gandalf",
            "entry_type_id": entry_type_id,
            "timeline_start_year": None,   # Unknown - he's a Maia
            "timeline_end_year": None,
            "timeline_is_circa": False,
            "timeline_is_ongoing": True,
        },
        {
            "title": "Boromir",
            "slug": "boromir",
            "entry_type_id": entry_type_id,
            "timeline_start_year": 2978,
            "timeline_end_year": 3019,
            "timeline_is_circa": False,
            "timeline_is_ongoing": False,
        },
    ]

    created_entries = []

    for entry_data in entries_data:
        response = requests.post(
            f"{BASE_URL}/weaves/{weave_id}/worlds/{world_id}/entries/",
            json=entry_data,
            headers={"Authorization": f"Bearer {token}"},
        )

        if response.status_code != 201:
            print_error(f"  Failed to create entry '{entry_data['title']}': {response.status_code} - {response.text}")
            continue

        entry = response.json()
        timeline = ""
        if entry["timeline_start_year"]:
            timeline = f" (T.A. {entry['timeline_start_year']}"
            if entry["timeline_end_year"]:
                timeline += f" - F.A. {entry['timeline_end_year']}"
            else:
                timeline += " - present"
            timeline += ")"
        else:
            timeline = " (timeless)"

        print_success(f"Created Entry: {entry['title']}{timeline}")
        created_entries.append(entry)

    return created_entries


def set_field_values(token: str, weave_id: str, world_id: str, entries: list[dict[str, Any]]):
    """Set field values with temporal ranges."""
    print_section("6. Set Field Values with Temporal Support")

    # Get field definitions
    aragorn = next(e for e in entries if e["slug"] == "aragorn")

    response = requests.get(
        f"{BASE_URL}/weaves/{weave_id}/worlds/{world_id}/entry-types/{aragorn['entry_type_id']}/fields",
        headers={"Authorization": f"Bearer {token}"},
    )

    if response.status_code != 200:
        print_error(f"Failed to get fields: {response.status_code}")
        return

    fields = {f["slug"]: f for f in response.json()["data"]}

    # Set Aragorn's field values
    print("\n  Setting Aragorn's field values:")

    # Race (non-temporal)
    race_value = {
        "field_definition_id": fields["race"]["id"],
        "value": {"text": "Human (Dúnedain)"},
    }

    response = requests.post(
        f"{BASE_URL}/weaves/{weave_id}/worlds/{world_id}/entries/{aragorn['id']}/fields",
        json=race_value,
        headers={"Authorization": f"Bearer {token}"},
    )

    if response.status_code == 201:
        print_success("  Set Race = Human (Dúnedain)")
    else:
        print_error(f"  Failed to set Race: {response.status_code} - {response.text}")

    # Title (temporal - changes over time!)
    title_values = [
        {
            "field_definition_id": fields["title"]["id"],
            "value": {"text": "Strider"},
            "timeline_start_year": 2956,
            "timeline_end_year": 3019,
        },
        {
            "field_definition_id": fields["title"]["id"],
            "value": {"text": "King of Gondor and Arnor"},
            "timeline_start_year": 3019,
            "timeline_end_year": None,
            "timeline_is_ongoing": True,
        },
    ]

    for title_value in title_values:
        response = requests.post(
            f"{BASE_URL}/weaves/{weave_id}/worlds/{world_id}/entries/{aragorn['id']}/fields",
            json=title_value,
            headers={"Authorization": f"Bearer {token}"},
        )

        if response.status_code == 201:
            timeline = f"{title_value['timeline_start_year']}"
            if title_value.get("timeline_end_year"):
                timeline += f"-{title_value['timeline_end_year']}"
            else:
                timeline += "-present"
            print_success(f"  Set Title = \"{title_value['value']}\" ({timeline})")
        else:
            print_error(f"  Failed to set Title: {response.status_code} - {response.text}")


def test_temporal_filtering(token: str, weave_id: str, world_id: str):
    """Test temporal filtering of entries."""
    print_section("7. Test Temporal Filtering")

    test_years = [2950, 3000, 3019, 3050]

    for year in test_years:
        response = requests.get(
            f"{BASE_URL}/weaves/{weave_id}/worlds/{world_id}/entries/?timeline_year={year}",
            headers={"Authorization": f"Bearer {token}"},
        )

        if response.status_code != 200:
            print_error(f"  Failed to filter by year {year}: {response.status_code}")
            continue

        entries = response.json()["data"]
        characters = [e["title"] for e in entries]
        print_success(f"Year {year}: {len(characters)} character(s) alive - {', '.join(characters)}")


def test_field_value_history(token: str, weave_id: str, world_id: str, entries: list[dict[str, Any]]):
    """Test getting field value history."""
    print_section("8. Test Field Value History")

    aragorn = next(e for e in entries if e["slug"] == "aragorn")

    # Get entry with fields
    response = requests.get(
        f"{BASE_URL}/weaves/{weave_id}/worlds/{world_id}/entries/{aragorn['id']}",
        headers={"Authorization": f"Bearer {token}"},
    )

    if response.status_code != 200:
        print_error(f"Failed to get entry: {response.status_code}")
        return

    entry_with_fields = response.json()
    print(f"\n  Aragorn's current field values:")
    for field_id, value in entry_with_fields.get("field_values", {}).items():
        print(f"    {field_id}: {value}")

    # Get field value history
    response = requests.get(
        f"{BASE_URL}/weaves/{weave_id}/worlds/{world_id}/entries/{aragorn['id']}/fields",
        headers={"Authorization": f"Bearer {token}"},
    )

    if response.status_code == 200:
        field_values = response.json()["data"]
        print(f"\n  Aragorn's field value history ({len(field_values)} values):")
        for fv in field_values:
            timeline = ""
            if fv.get("timeline_start_year"):
                timeline = f" ({fv['timeline_start_year']}"
                if fv.get("timeline_end_year"):
                    timeline += f"-{fv['timeline_end_year']}"
                else:
                    timeline += "-present"
                timeline += ")"
            print(f"    {fv['value']}{timeline}")


def main():
    """Run the complete test workflow."""
    print("\n" + "=" * 80)
    print("  WORLDBUILDING SYSTEM TEST")
    print("=" * 80)

    try:
        # 1. Login
        token = login()

        # 2. Create Weave
        weave = create_weave(token)

        # 3. Create World
        world = create_world(token, weave["id"])

        # 4. Create Entry Type with custom fields
        entry_type = create_entry_type(token, weave["id"], world["id"])

        # 5. Create Entries with temporal validity
        entries = create_entries(token, weave["id"], world["id"], entry_type["id"])

        # 6. Set field values with temporal ranges
        set_field_values(token, weave["id"], world["id"], entries)

        # 7. Test temporal filtering
        test_temporal_filtering(token, weave["id"], world["id"])

        # 8. Test field value history
        test_field_value_history(token, weave["id"], world["id"], entries)

        print_section("SUMMARY")
        print_success("All tests completed successfully!")
        print(f"\nAPI Documentation: http://localhost:8000/docs")
        print(f"Weave ID: {weave['id']}")
        print(f"World ID: {world['id']}")

    except Exception as e:
        print_error(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
