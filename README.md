# Cortex

**AI-First Web Framework** -- Build applications where AI agents are first-class citizens.

Cortex is a Next.js-based framework that uses the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) to give AI agents structured, discoverable access to every module, entity, API endpoint, and event in your application.

## Quick Start

```bash
# Clone the repository
git clone <your-repo-url> cortex
cd cortex

# Install dependencies
npm install

# Start PostgreSQL and Redis
docker compose up -d

# Run database migrations
npm run db:generate
npm run db:migrate

# Seed with sample data
npm run seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## What You Get

- **Modular Architecture** -- Self-contained modules with entities, APIs, events, MCP tools, and UI components
- **MCP Server** -- AI agents can discover and interact with your entire application through standardized tools
- **Auto-Generated CRUD** -- Every entity automatically gets create, read, update, delete MCP tools and API endpoints
- **Event Bus** -- Publish/subscribe domain events with database persistence
- **GTM Data Layer** -- Domain events automatically map to Google Tag Manager data layer pushes
- **Theme System** -- Swappable themes with design tokens, components, and layouts
- **AI Theme Generator** -- Describe your design in natural language and let Claude create the design tokens

## Generate a Custom Theme

### With AI (requires ANTHROPIC_API_KEY)

```bash
# From a description file
ANTHROPIC_API_KEY=sk-... npm run theme:generate -- --file .cortex/layout-instructions.example.md --name my-brand

# From an inline description
ANTHROPIC_API_KEY=sk-... npm run theme:generate -- --description "Modern SaaS with deep blue primary, rounded corners, Inter font" --name saas-blue
```

### Without AI

```bash
# Copy the default theme and customize theme.json manually
npm run theme:generate -- --name my-theme

# Activate your theme
npm run theme:activate -- my-theme
```

### Manage Themes

```bash
# List all themes
npm run theme:list
```

## MCP Integration

Cortex exposes a full MCP server that AI agents can connect to via stdio or HTTP.

### Connect Claude Desktop or Cursor

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

### Connect via HTTP

Send JSON-RPC messages to `POST /api/mcp`.

### Available Tools

**Discovery:** `list_modules`, `get_module_spec`, `discover_schema`, `find_api`

**Blog CRUD:** `create_post`, `get_post`, `list_posts`, `update_post`, `delete_post`, `create_comment`, `get_comment`, `list_comments`, `update_comment`, `delete_comment`

**Blog Custom:** `publish_post`, `search_posts`

## API Reference

### Blog Posts

| Method | Endpoint                              | Description           |
|--------|---------------------------------------|-----------------------|
| GET    | `/api/modules/blog/posts`             | List posts            |
| POST   | `/api/modules/blog/posts`             | Create a post         |
| GET    | `/api/modules/blog/posts/:id`         | Get a post            |
| PUT    | `/api/modules/blog/posts/:id`         | Update a post         |
| DELETE | `/api/modules/blog/posts/:id`         | Delete a post         |
| POST   | `/api/modules/blog/posts/:id/publish` | Publish a post        |

Query parameters for listing: `status`, `tag`, `search`, `page`, `perPage`

### Blog Comments

| Method | Endpoint                                  | Description           |
|--------|-------------------------------------------|-----------------------|
| GET    | `/api/modules/blog/comments`              | List comments         |
| POST   | `/api/modules/blog/comments`              | Create a comment      |
| GET    | `/api/modules/blog/comments/:id`          | Get a comment         |
| PUT    | `/api/modules/blog/comments/:id`          | Update a comment      |
| DELETE | `/api/modules/blog/comments/:id`          | Delete a comment      |

Query parameters for listing: `postId`, `status`, `page`, `perPage`

### Health

| Method | Endpoint       | Description        |
|--------|----------------|--------------------|
| GET    | `/api/health`  | Health check       |

## Project Structure

```
cortex/
  src/
    core/                   Core framework systems
      module-registry.ts      Module discovery and loading
      mcp-server.ts           MCP server with tool registration
      event-bus.ts            Pub/sub event bus with persistence
      data-layer.ts           GTM data layer integration
      theme-registry.ts       Theme discovery and management
      types.ts                Shared TypeScript interfaces
    lib/
      db.ts                   Drizzle database connection
      schema.ts               Core schema (events table)
      env.ts                  Environment validation (Zod)
    app/
      api/
        health/               Health check endpoint
        mcp/                  MCP HTTP transport
        modules/[...path]/    Dynamic module API routing
      blog/                   Blog frontend pages
      page.tsx                Homepage
      layout.tsx              Root layout with theme provider
  modules/
    blog/                     Blog module
      module.json               Module manifest
      entities/                 post.ts, comment.ts
      api/                      posts.ts, comments.ts
      events.ts                 Event definitions
      mcp-tools.ts              Custom MCP tools
      components/               PostCard.tsx
      AGENTS.md                 AI documentation
  themes/
    default/                  Default theme
      theme.json                Design tokens
      components/               Button, Card, Header, Footer, Hero, etc.
      layouts/                  BaseLayout, LandingLayout, BlogLayout
      styles/                   theme.css
  scripts/
    mcp-stdio.ts              MCP stdio transport for CLI agents
    generate-theme.ts         Theme generator CLI
    seed.ts                   Database seed script
  drizzle/                    Generated migrations
  AGENTS.md                   Framework-level AI documentation
```

## Creating a Module

1. Create a directory under `modules/` (e.g., `modules/shop/`)
2. Add a `module.json` manifest:
   ```json
   {
     "id": "shop",
     "name": "Shop",
     "version": "1.0.0",
     "description": "E-commerce module",
     "enabled": true,
     "dependencies": [],
     "entities": ["product", "order"],
     "events": {
       "publishes": ["order.created", "order.fulfilled"],
       "subscribes": []
     },
     "dataLayer": {}
   }
   ```
3. Define entities in `entities/` using Drizzle ORM
4. Create API handlers in `api/` exporting `{ handlers: Record<string, ApiHandler> }`
5. Add custom MCP tools in `mcp-tools.ts` exporting `{ tools: McpTool[] }`
6. Add event definitions in `events.ts`
7. Write `AGENTS.md` for AI-readable documentation
8. Run `npm run db:generate && npm run db:migrate`

The module registry discovers your module automatically on startup.

## Tech Stack

- **Runtime:** Next.js 15 with App Router
- **Language:** TypeScript 5 (strict mode)
- **Database:** PostgreSQL 16 with Drizzle ORM
- **AI Protocol:** Model Context Protocol (MCP)
- **Styling:** Tailwind CSS 4
- **Validation:** Zod
- **Cache:** Redis 7 (via Docker)
- **Package Manager:** npm

## License

MIT
