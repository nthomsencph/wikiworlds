This file provides guidance to LLMs when working with code in this repository.

## Project Overview

**WikiWorlds** is a sophisticated worldbuilding and collaborative wiki system for authors, D&D Dungeon Masters, and creative writers. Create richly detailed fictional universes with temporal tracking, hierarchical organization, and collaborative editing.

**Key Features:**
- 🌍 Multi-world management within workspaces (Weaves)
- ⏰ Temporal system: Track when entities exist in your fictional timeline
- 🌳 Hierarchical organization with PostgreSQL ltree
- 🎨 Custom entry types with user-defined fields
- 📝 Block-based rich text editor (TipTap)
- 🔄 Temporal field values: Properties that change over time
- 👥 Multi-user collaboration with role-based permissions

## Tech Stack

**Backend:**
- FastAPI (Python 3.12+)
- SQLModel (ORM)
- PostgreSQL 15+ with ltree extension
- Alembic (migrations)
- uv (package manager)

**Frontend:**
- Next.js 15 (App Router)
- React 19
- TypeScript
- Chakra UI v3
- TanStack Query v5
- TipTap v3 (rich text editor)
- Framer Motion (animations)

**Infrastructure:**
- Docker Compose
- Traefik (reverse proxy)
- Pre-commit hooks

## Development Commands

### Quick Start

```bash
# Start all services with hot reload
docker compose watch

# Stop services
docker compose down

# View logs
docker compose logs backend
docker compose logs frontend
```

### Backend Development

```bash
# Location: backend/

# Install dependencies
uv sync

# Activate virtual environment
source .venv/bin/activate

# Run tests
bash ./scripts/test.sh

# Create migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Run locally (after stopping Docker backend)
docker compose stop backend
fastapi dev app/main.py

# Code quality
uv run pre-commit run --all-files
```

### Frontend Development

```bash
# Location: frontend/

# Install dependencies
npm install

# Run locally (after stopping Docker frontend)
docker compose stop frontend
npm run dev

# Regenerate API client (after backend changes)
npm run generate-client

# Lint and format
npm run lint:fix
npm run format

# Type check
npm run type-check
```

## Architecture

### Backend Structure

```
backend/app/
├── main.py                    # FastAPI app entry point
├── config.py                  # Settings (reads from .env)
├── api/
│   ├── main.py               # API router aggregation
│   ├── deps.py               # Common dependencies (auth, db)
│   ├── deps_worldbuilding.py # Weave/World context dependencies
│   └── routes/               # API endpoints
│       ├── login.py, users.py, items.py
│       ├── weaves.py         # Workspace management
│       ├── worlds.py         # Universe/campaign management
│       ├── entry_types.py    # Custom entry schemas
│       ├── entries.py        # Wiki pages (core content)
│       └── blocks.py         # Block-based content
├── models/                   # SQLModel data models
│   ├── user.py, item.py      # Legacy models
│   ├── weave.py              # Weave, World (multi-tenancy)
│   ├── entry.py              # EntryType, Entry, FieldValue
│   ├── block.py              # Block, Comment, Attachment
│   ├── reference.py          # Relationships, Tags
│   ├── timeline.py           # Timeline, Era
│   ├── versioning.py         # Version history, Activity log
│   ├── permission.py         # ABAC permissions, Teams
│   └── schemas/              # Pydantic request/response schemas
├── db/
│   ├── database.py           # Database engine, session
│   └── crud/                 # CRUD operations
│       ├── weave.py, world.py, entry_type.py
│       ├── entry.py          # Entry + field CRUD with temporal support
│       └── block.py
├── core/
│   └── security.py           # JWT authentication
├── utils/
│   ├── ltree.py              # Ltree path utilities
│   └── temporal.py           # Temporal query helpers
└── alembic/                  # Database migrations
```

**Key patterns:**
- Routes → CRUD → SQLModel (layered architecture)
- JWT authentication via `app/core/security.py`
- Dependency injection for auth, db, permissions
- Settings from `.env` via `app/config.py`
- Worldbuilding routes nested: `/api/v1/weaves/{weave_id}/worlds/{world_id}/entries/`

### Frontend Structure

```
frontend/src/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout (Chakra, TanStack Query)
│   ├── (protected)/         # Authenticated routes
│   │   ├── layout.tsx       # Protected layout (conditional sidebar)
│   │   ├── weaves/          # Main app (worldbuilding)
│   │   │   ├── page.tsx     # Auto-redirect to first weave
│   │   │   └── [weaveId]/worlds/[worldId]/
│   │   │       ├── page.tsx              # World dashboard
│   │   │       ├── entries/[entryId]/    # Entry detail (WIP)
│   │   │       └── entry-types/          # Type management (WIP)
│   │   ├── settings/, admin/, items/  # Legacy admin
│   └── login/, signup/      # Public auth pages
├── components/
│   ├── Weaves/              # Worldbuilding components
│   ├── Worlds/
│   ├── Common/              # Navbar, Sidebar, UserMenu
│   ├── ui/                  # Chakra UI components
│   ├── Dock.tsx             # macOS-style animated dock
│   ├── Masonry.tsx          # Pinterest-style card grid
│   ├── AnimatedList.tsx
│   └── LiquidEther.tsx      # Three.js background
├── client/                  # Auto-generated API client
│   ├── sdk.gen.ts
│   └── types.gen.ts
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities
└── theme/                   # Chakra UI v3 theme

editor/                      # Standalone TipTap editor
├── full-editor.tsx
├── page-editor.tsx
├── title-editor.tsx
├── components/              # Bubble menu, slash menu, etc.
├── extensions/              # TipTap extensions
└── styles/                  # Editor CSS
```

**Key patterns:**
- All weave pages are client components (`"use client"`)
- TanStack Query for API calls with automatic caching
- Auto-generated TypeScript client from OpenAPI
- Weaves section uses custom layout (no standard sidebar)
- World dashboard has multiple view modes: Dashboard (Masonry), Tree, Timeline, Search, Knowledge Graph

## Important Concepts

### 1. Temporal System

**All entities can exist at specific points in the fictional timeline.**

Every temporal entity has:
```python
timeline_start_year: int | None   # None = ancient/unknown
timeline_end_year: int | None     # None = ongoing/current
timeline_is_circa: bool           # Approximate dates
timeline_is_ongoing: bool         # Still exists
```

**What is temporal:**
- **Entries**: When does this character/place exist?
- **Field Values**: Properties that change over time (e.g., "Ruler" field)
- **Blocks**: Content describing specific time periods
- **References**: Relationships valid for specific periods

**Temporal queries:**
```python
# Get entries that existed in year 250
entries = session.exec(
    select(Entry)
    .where(Entry.world_id == world_id)
    .where((Entry.timeline_start_year == None) | (Entry.timeline_start_year <= 250))
    .where((Entry.timeline_end_year == None) | (Entry.timeline_end_year >= 250))
).all()
```

**Important:** Always handle NULL properly:
- NULL start = existed since ancient times
- NULL end = still exists/ongoing

**API support:** All temporal endpoints accept `?timeline_year=250` parameter.

### 2. Hierarchical Organization (ltree)

**Entries are organized in a tree using PostgreSQL ltree extension.**

Path format: `"uuid1.uuid2.uuid3"` (UUIDs avoid naming conflicts)

Example tree:
```
World: Middle Earth
├── regions (path: "regions_uuid")
│   ├── eriador (path: "regions_uuid.eriador_uuid")
│   │   └── shire (path: "regions_uuid.eriador_uuid.shire_uuid")
│   └── gondor (path: "regions_uuid.gondor_uuid")
└── characters (path: "characters_uuid")
    └── aragorn (path: "characters_uuid.aragorn_uuid")
```

**Queries:**
- Get descendants: `WHERE path <@ 'parent.path'`
- Get ancestors: `WHERE 'entry.path' <@ path`
- Get direct children: `WHERE path ~ 'parent.path.*{1}'`

**Utilities:** Use `backend/app/utils/ltree.py` for path manipulation.

**Index:** Requires GiST index: `CREATE INDEX idx_entry_path_gist ON entry USING gist(path);`

### 3. Block-Based Content

**Entries use blocks instead of a single content field (Notion-style).**

**Benefits:**
- Granular versioning
- Temporal blocks (different content for different time periods)
- Rich content types (tables, code, math, embeds)
- Reusable content

**Block types:**
- Text: paragraph, heading1-3, quote, callout
- Lists: bullet_list, numbered_list, checklist, toggle_list
- Media: image, video, file, embed, audio
- Structured: table, database_view, code, equation
- Special: reference, timeline_event, map_marker, divider, table_of_contents

**Each block has:**
```python
block_type: str           # Type of block
content: dict             # JSON structure (varies by type)
position: float           # Ordering (fractional indexing)
timeline_start_year: int  # Optional temporal validity
timeline_end_year: int
```

**API:** Blocks belong to entries, accessed via nested routes.

### 4. Multi-Tenancy (Weave → World → Entry)

**Three-level hierarchy:**
- **Weave**: Workspace/tenant (like Notion workspace)
  - Has members with roles: owner, admin, member
  - Contains multiple Worlds
- **World**: Universe/campaign (like Notion database)
  - Has members with roles: admin, editor, commenter, viewer
  - Contains Entries
- **Entry**: Wiki page with custom fields

**Permission cascade:** Weave admins automatically have access to all Worlds in that Weave.

## Development URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs
- Adminer (DB): http://localhost:8080
- Traefik UI: http://localhost:8090

## Important Notes

- **Package manager**: Backend uses `uv` (not pip/poetry)
- **Migrations**: Always create with `alembic revision --autogenerate`, then apply with `alembic upgrade head`
- **ltree required**: PostgreSQL ltree extension must be enabled (migration `001_enable_ltree_extension.py`)
- **API client**: Regenerate after backend changes: `npm run generate-client`
- **Temporal queries**: Always handle NULL start/end years (ancient/ongoing entities)
- **Field values**: Stored as JSON dicts, wrap simple values: `{"text": "value"}` or `{"number": 42}`
- **Chakra UI v3**: Breaking changes from v2, use MCP tools to verify correct usage
- **Block sync**: Backend Block model is separate from TipTap document structure