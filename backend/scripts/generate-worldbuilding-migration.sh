#!/bin/bash

# Script to generate Alembic migration for worldbuilding models
# This should be run from the backend/ directory

set -e

echo "Generating migration for worldbuilding models..."

# Make sure we're in the backend directory
cd "$(dirname "$0")/.."

# Generate the migration
alembic revision --autogenerate -m "Add worldbuilding models with temporal support"

echo ""
echo "Migration generated successfully!"
echo ""
echo "IMPORTANT: Review the generated migration file in app/alembic/versions/"
echo "Make sure it includes:"
echo "  1. All worldbuilding tables (weave, world, entry, block, reference, etc.)"
echo "  2. Proper indexes on temporal fields (timeline_start_year, timeline_end_year)"
echo "  3. GiST index on entry.path for ltree queries"
echo "  4. GIN index on entry.search_vector for full-text search"
echo ""
echo "After reviewing, apply the migration with:"
echo "  alembic upgrade head"
