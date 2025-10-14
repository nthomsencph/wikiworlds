# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack FastAPI + Next.js template based on the official FastAPI Full Stack Template. It provides a complete modern web application stack with authentication, database management, and a responsive dashboard.

**Tech Stack:**
- **Backend**: FastAPI (Python), SQLModel (ORM), PostgreSQL, Alembic (migrations)
- **Frontend**: Next.js 15 (App Router), TypeScript, Chakra UI v3, TanStack Query
- **Infrastructure**: Docker Compose, Traefik (reverse proxy)
- **Development**: uv (Python), npm (Node.js), pre-commit hooks

## Development Commands

### Starting the Stack

```bash
# Start all services with hot reload (recommended for development)
docker compose watch

# Stop all services
docker compose down

# View logs
docker compose logs
docker compose logs backend
docker compose logs frontend
```

### Backend Development

**Location**: `backend/`

```bash
# Install dependencies (from backend/ directory)
uv sync

# Activate virtual environment
source .venv/bin/activate

# Run tests
bash ./scripts/test.sh

# Run tests in running container
docker compose exec backend bash scripts/tests-start.sh

# Run tests with additional pytest args (e.g., stop on first error)
docker compose exec backend bash scripts/tests-start.sh -x

# Run backend locally (after stopping Docker service)
docker compose stop backend
cd backend
fastapi dev app/main.py

# Code linting/formatting (from root directory)
uv run pre-commit run --all-files

# Database migrations (inside backend container)
docker compose exec backend bash
alembic revision --autogenerate -m "Description"
alembic upgrade head

# Type checking
mypy backend/app

# Access backend container shell
docker compose exec backend bash
```

### Frontend Development

**Location**: `frontend/`

```bash
# Install dependencies (from frontend/ directory)
npm install

# Run frontend locally (after stopping Docker service)
docker compose stop frontend
cd frontend
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
npm run lint:fix

# Format code
npm run format
npm run format:check

# Type check
npm run type-check

# Generate API client from backend OpenAPI spec
npm run generate-client
```

### Running Single Tests

```bash
# Backend: Run specific test file
docker compose exec backend bash -c "pytest app/tests/api/routes/test_users.py -v"

# Backend: Run specific test function
docker compose exec backend bash -c "pytest app/tests/api/routes/test_users.py::test_create_user -v"

# Backend: Run with coverage
docker compose exec backend bash -c "pytest --cov=app --cov-report=html"
```

## Architecture

### Backend Structure

The backend follows a layered architecture pattern:

- **`app/main.py`**: FastAPI application entry point with CORS and Sentry configuration
- **`app/api/`**: API layer with route definitions
  - `app/api/main.py`: Router aggregation (includes login, users, items, utils, private routes)
  - `app/api/routes/`: Individual route modules (login, users, items, utils, private)
  - `app/api/deps.py`: Dependency injection (database sessions, current user, permissions)
- **`app/models/`**: SQLModel data models (User, Item) - these define both Pydantic schemas and SQL tables
- **`app/db/`**: Database layer
  - `app/db/database.py`: Database engine and session configuration
  - `app/db/crud/`: CRUD operations for each model
- **`app/core/`**: Core functionality (security, authentication)
- **`app/config.py`**: Application settings using pydantic-settings
- **`app/alembic/`**: Database migration files
- **`app/tests/`**: Test suite organized by layer (api, crud, utils)

**Key patterns:**
- Routes depend on CRUD functions for database operations
- Authentication uses JWT tokens via `app/core/security.py`
- Dependencies injected through `app/api/deps.py` (e.g., `get_current_user`, `get_db`)
- Settings managed via `app/config.py` which reads from `.env`

### Frontend Structure

Next.js App Router with server and client components:

- **`src/app/`**: Next.js App Router pages
  - `src/app/(protected)/`: Route group for authenticated pages (settings, admin, items)
  - `src/app/login/`, `src/app/signup/`: Public authentication pages
  - `src/app/layout.tsx`: Root layout with theme provider and query client
- **`src/components/`**: React components organized by feature
  - `src/components/Common/`: Shared components (Navbar, Sidebar, ActionsMenu)
  - `src/components/Items/`, `src/components/Admin/`, `src/components/UserSettings/`: Feature-specific components
  - `src/components/ui/`: Chakra UI primitives and custom UI components
- **`src/client/`**: Auto-generated TypeScript API client from OpenAPI spec
- **`src/hooks/`**: Custom React hooks (auth, queries)
- **`src/lib/`**: Utilities and helper functions
- **`src/theme/`**: Chakra UI theme configuration

**Key patterns:**
- Protected routes wrapped in `(protected)` group - authentication handled via middleware
- State management via TanStack Query for server state
- API calls use auto-generated client from `src/client/`
- Forms use React Hook Form with Chakra UI components
- Dark mode support via Chakra UI theme system

### Database Migrations

When modifying SQLModel models in `backend/app/models/`:

1. Make model changes
2. Create migration: `docker compose exec backend bash -c "alembic revision --autogenerate -m 'description'"`
3. Review generated migration in `backend/app/alembic/versions/`
4. Apply migration: `docker compose exec backend bash -c "alembic upgrade head"`

**Note**: Migrations run automatically via `prestart` service in Docker Compose, but must be created manually during development.

### API Client Generation

The frontend uses an auto-generated TypeScript client based on the backend's OpenAPI schema:

1. Backend must be running: `docker compose up backend`
2. Generate client: `cd frontend && npm run generate-client`
3. Client generated in `frontend/src/client/`

Regenerate whenever backend API changes (new endpoints, modified schemas).

### Environment Configuration

Configuration via `.env` file at project root:

- `DOMAIN`: Base domain for Traefik routing (use `localhost` for local development)
- `FRONTEND_HOST`: Frontend URL used by backend for email links
- `ENVIRONMENT`: `local`, `staging`, or `production`
- `SECRET_KEY`: JWT signing key (generate with `python -c "import secrets; print(secrets.token_urlsafe(32))"`)
- `FIRST_SUPERUSER` / `FIRST_SUPERUSER_PASSWORD`: Initial admin credentials
- `POSTGRES_*`: Database connection settings
- `BACKEND_CORS_ORIGINS`: Comma-separated allowed CORS origins

### Docker Compose Configuration

- **`docker-compose.yml`**: Base production configuration
- **`docker-compose.override.yml`**: Development overrides (volume mounts, hot reload)
- **`docker-compose.traefik.yml`**: Traefik proxy configuration for production

Services: `db` (PostgreSQL), `backend`, `frontend`, `adminer` (database UI), `prestart` (migrations/init)

Development mode mounts source code as volumes for hot reloading.

### Pre-commit Hooks

The project uses pre-commit for code quality:

- **Setup**: `uv run pre-commit install` (run once)
- **Manual run**: `uv run pre-commit run --all-files`
- **Tools**: ruff (Python linting/formatting), eslint, prettier (JS/TS)

Hooks run automatically on `git commit`.

## Development URLs

**Standard (localhost):**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs
- API Docs (ReDoc): http://localhost:8000/redoc
- Adminer (DB): http://localhost:8080
- Traefik UI: http://localhost:8090

**With localhost.tiangolo.com (subdomain testing):**
Set `DOMAIN=localhost.tiangolo.com` in `.env`, then:
- Frontend: http://dashboard.localhost.tiangolo.com
- Backend: http://api.localhost.tiangolo.com
- API Docs: http://api.localhost.tiangolo.com/docs

## Important Notes

- The backend uses `uv` for Python dependency management (not pip/poetry)
- Frontend API client must be regenerated after backend schema changes
- Always create Alembic migrations when modifying models - auto table creation is disabled
- Private debug routes in `app/api/routes/private.py` only available in local environment
- Tests use a separate test database configured in `backend/app/tests/conftest.py`
- Backend virtual environment location: `backend/.venv/bin/python`
