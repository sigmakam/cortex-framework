# Cortex AI-First Web Framework

## Overview

Cortex is an AI-first web framework built on Next.js. It uses the Model Context Protocol (MCP) to give AI agents structured, discoverable access to every module, entity, API endpoint, and event in the application. Modules are self-contained units that register themselves automatically on startup.

## Architecture

```
cortex/
  src/
    core/           Core systems (module registry, MCP server, event bus, data layer, themes)
    lib/            Database connection, schema, environment config
    app/            Next.js app router (pages, API routes)
  modules/          First-party modules (e.g., blog)
  plugins/          Third-party / community modules
  themes/           Theme packages (components, layouts, design tokens)
  scripts/          CLI tools (MCP stdio, seed, theme generator)
```

### Core Systems

- **Module Registry** (`src/core/module-registry.ts`) — Discovers and loads modules from `modules/` and `plugins/`. Exposes entities, API handlers, MCP tools, events, and data layer mappings.
- **MCP Server** (`src/core/mcp-server.ts`) — Creates an MCP server with discovery tools, auto-generated CRUD tools, and module custom tools.
- **Event Bus** (`src/core/event-bus.ts`) — Publish/subscribe event system with database persistence.
- **Data Layer** (`src/core/data-layer.ts`) — Maps domain events to GTM data layer pushes.
- **Theme Registry** (`src/core/theme-registry.ts`) — Discovers and manages themes with design tokens.

## MCP Connection

### stdio (Claude Desktop, Cursor, etc.)

Add to your MCP client configuration:
```json
{
  "mcpServers": {
    "cortex": {
      "command": "npx",
      "args": ["tsx", "scripts/mcp-stdio.ts"]
    }
  }
}
```

### HTTP

Send JSON-RPC messages to `POST /api/mcp`.

## Available MCP Tools

### Core Discovery Tools

| Tool             | Description                                      |
|------------------|--------------------------------------------------|
| list_modules     | List all registered modules with entities and tools |
| get_module_spec  | Get a module's AGENTS.md for AI context           |
| discover_schema  | Search entity schemas by keyword                  |
| find_api         | Search API endpoints by keyword                   |

### Auto-Generated CRUD Tools (per entity)

For each entity resource (e.g., posts, comments), these tools are auto-generated:

- `create_{entity}` — Create a new record
- `get_{entity}` — Get a record by ID
- `list_{entities}` — List records with pagination and search
- `update_{entity}` — Update a record by ID
- `delete_{entity}` — Delete a record by ID

Currently registered: `create_post`, `get_post`, `list_posts`, `update_post`, `delete_post`, `create_comment`, `get_comment`, `list_comments`, `update_comment`, `delete_comment`

### Blog Custom Tools

| Tool          | Description                          | Input                         |
|---------------|--------------------------------------|-------------------------------|
| publish_post  | Publish a draft post                 | `{ postId: string }`          |
| search_posts  | Full-text search across posts        | `{ query: string, limit?: number }` |

## Module Structure

Every module directory contains:

```
module-name/
  module.json        Manifest (id, name, version, entities, events, dataLayer)
  entities/          Drizzle ORM table definitions
  api/               API route handlers (export { handlers })
  events.ts          Event definitions (publishes, subscribers)
  mcp-tools.ts       Custom MCP tools (export { tools })
  components/        React UI components
  AGENTS.md          AI-readable documentation
```

The module registry auto-discovers modules by scanning `modules/` and `plugins/` for directories containing a `module.json` file.

## API Response Pattern

All API responses follow a consistent structure:

```json
{
  "success": true,
  "data": { ... },
  "error": {
    "code": "NOT_FOUND",
    "message": "Human-readable message",
    "aiHint": "Actionable suggestion for AI agents"
  },
  "metadata": {
    "total": 42,
    "page": 1,
    "perPage": 10,
    "executionTimeMs": 12
  }
}
```

The `aiHint` field in error responses gives AI agents specific guidance on how to resolve the error.

## Quick Commands

| Command                  | Description                        |
|--------------------------|------------------------------------|
| `npm run dev`            | Start Next.js dev server           |
| `npm run seed`           | Seed the database                  |
| `npm run mcp`            | Start MCP stdio server             |
| `npm run db:generate`    | Generate Drizzle migrations        |
| `npm run db:migrate`     | Run database migrations            |
| `npm run db:studio`      | Open Drizzle Studio                |
| `npm run theme:generate` | Generate a new theme               |
| `npm run theme:activate` | Activate a theme                   |
| `npm run theme:list`     | List available themes              |
| `npm run build`          | Production build                   |

## Database

PostgreSQL 16, managed with Drizzle ORM. Connection string defaults to `postgresql://cortex:cortex@localhost:5432/cortex`.

Entities are defined in `modules/*/entities/*.ts` and `src/lib/schema.ts`. Run `npm run db:generate && npm run db:migrate` after schema changes.
