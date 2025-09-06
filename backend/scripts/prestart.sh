#! /usr/bin/env bash

set -e
set -x

# Let the DB start
python app/scripts/pre_start.py

# Run migrations
alembic upgrade head

# Create initial data in DB
python app/scripts/init_data.py
