#! /usr/bin/env bash

set -e
set -x

# Download OpenAPI spec from running backend
curl -o frontend/openapi.json http://localhost:8000/api/v1/openapi.json

cd frontend
npm run generate-client
# Note: using prettier instead of biome for Next.js project
npx prettier --write ./src/client
