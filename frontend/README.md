# Frontend - Next.js Application

This is the frontend for the FastAPI Full Stack Template, built with [Next.js](https://nextjs.org) and the App Router.

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Chakra UI v3
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form
- **Theme**: Dark/Light mode with system detection
- **API Client**: Auto-generated from OpenAPI spec
- **Testing**: Playwright for E2E tests
- **Linting**: ESLint + Prettier

## Getting Started

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Other Commands

```bash
# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
npm run lint:fix

# Format code
npm run format
npm run format:check

# Type check
npm run type-check

# Generate API client from backend
npm run generate-client
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (protected)/       # Protected routes group
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # UI components (Chakra UI)
│   ├── Common/           # Shared components
│   ├── Items/            # Item-related components
│   └── UserSettings/     # User settings components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
└── client/              # Auto-generated API client
```

## Features

- **Authentication**: JWT-based auth with protected routes
- **Dark Mode**: System theme detection + manual toggle
- **Responsive**: Mobile-first design with Chakra UI
- **Type Safety**: Full TypeScript integration
- **API Integration**: Auto-generated client from FastAPI OpenAPI spec
- **Form Handling**: React Hook Form with validation
- **Error Handling**: Centralized error management with toasts

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## API Client Generation

The API client is automatically generated from the backend's OpenAPI specification:

```bash
# Download OpenAPI spec and generate client
npm run generate-client
```

This creates TypeScript interfaces and service classes in `src/client/`.
