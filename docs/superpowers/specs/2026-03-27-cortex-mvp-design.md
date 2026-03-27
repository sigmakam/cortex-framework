# Cortex MVP — AI-First Web Framework

## Metadata
- **Status:** Approved
- **Author:** Krzysztof Moor + Claude
- **Created:** 2026-03-27
- **Version:** 1.1
- **Approach:** Monorepo, Next.js 15 App Router + custom module discovery

---

## Overview

Cortex is an AI-first web framework that treats AI agents as first-class citizens alongside human developers. The MVP demonstrates three flagship features:

1. **Module auto-discovery** — Drop a folder in `/modules`, the framework auto-discovers entities, API routes, MCP tools, and events. Zero configuration.
2. **Built-in MCP server** — Every module's entities automatically get CRUD tools that AI agents can discover and invoke.
3. **GTM data layer** — Every module event automatically pushes to `window.dataLayer` for Google Tag Manager.

A working **blog module** proves all three systems work together.
4. **Theme system + AI generator** — Professional default theme with AI-powered theme generation from plain-text layout descriptions. Clone → describe → professional website in <30 minutes.

---

## Project Structure

```
cortex/
├── package.json
├── tsconfig.json
├── next.config.ts
├── docker-compose.yml            # PostgreSQL + Redis
├── drizzle.config.ts
├── .env.example
├── .env.local                    # (gitignored)
├── AGENTS.md                     # Root-level AI guide
├── README.md
│
├── src/
│   ├── core/                     # Framework core
│   │   ├── module-registry.ts    # Auto-discovery engine
│   │   ├── event-bus.ts          # Domain event pub/sub
│   │   ├── mcp-server.ts         # MCP server (HTTP + stdio)
│   │   ├── data-layer.ts         # GTM dataLayer bridge (server-side config)
│   │   ├── theme-registry.ts     # Theme discovery and management
│   │   ├── theme-types.ts        # Theme interfaces
│   │   └── types.ts              # Core interfaces
│   │
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout (DataLayerProvider + GTM script)
│   │   ├── page.tsx              # Homepage / dashboard
│   │   ├── globals.css           # Tailwind base styles
│   │   ├── api/
│   │   │   ├── mcp/route.ts      # MCP HTTP transport
│   │   │   ├── health/route.ts   # Health check endpoint
│   │   │   └── modules/
│   │   │       └── [...path]/route.ts  # Dynamic route for all module APIs
│   │   ├── admin/
│   │   │   ├── layout.tsx        # Admin layout
│   │   │   └── page.tsx          # Admin dashboard
│   │   └── blog/                 # Blog frontend pages
│   │       ├── page.tsx          # Post list
│   │       └── [slug]/page.tsx   # Single post
│   │
│   ├── components/
│   │   ├── DataLayerProvider.tsx  # Client component: initializes dataLayer
│   │   └── GTMScript.tsx         # Client component: GTM container snippet
│   │
│   └── lib/
│       ├── db.ts                 # Drizzle PostgreSQL client
│       └── env.ts                # Environment variable validation (Zod)
│
├── modules/                      # Auto-discovered modules
│   └── blog/
│       ├── module.json           # Module metadata
│       ├── AGENTS.md             # AI-readable documentation
│       ├── entities/
│       │   ├── post.ts           # Post Drizzle schema
│       │   └── comment.ts        # Comment Drizzle schema
│       ├── api/
│       │   ├── posts.ts          # CRUD handlers for posts
│       │   └── comments.ts       # CRUD handlers for comments
│       ├── components/
│       │   └── PostCard.tsx      # Post card component
│       ├── events.ts             # Event definitions + subscribers
│       └── mcp-tools.ts          # Custom MCP tools (publish, search)
│
├── plugins/                      # Third-party extensions (empty for MVP)
│
├── themes/                       # Auto-discovered themes
│   └── default/                  # Professional default theme
│       ├── theme.json            # Design tokens
│       ├── components/
│       │   ├── Button.tsx
│       │   ├── Card.tsx
│       │   ├── Header.tsx
│       │   ├── Footer.tsx
│       │   ├── Hero.tsx
│       │   ├── Section.tsx
│       │   └── Container.tsx
│       ├── layouts/
│       │   ├── BaseLayout.tsx
│       │   ├── LandingLayout.tsx
│       │   └── BlogLayout.tsx
│       └── styles/
│           └── theme.css
│
├── scripts/
│   ├── mcp-stdio.ts              # stdio MCP entry point for CLI agents
│   ├── generate-theme.ts         # AI theme generator CLI
│   └── seed.ts                   # Database seed script
│
├── .cortex/
│   └── layout-instructions.example.md  # Layout description examples
│
└── .ai/
    └── specs/                    # Spec-first development folder
```

---

## 1. Module Auto-Discovery

### Boot Sequence

1. On server startup (Next.js `instrumentation.ts`), the `ModuleRegistry` scans `/modules` and `/plugins`
2. Reads `module.json` from each subdirectory
3. Resolves dependency order via topological sort
4. For each enabled module:
   - Loads entity schemas from `entities/*.ts` (Drizzle table definitions)
   - Loads API handlers from `api/*.ts`
   - Loads custom MCP tools from `mcp-tools.ts` (if exists)
   - Loads event definitions from `events.ts` (if exists)
   - Loads data layer mappings from `module.json` `dataLayer` field
   - Reads `AGENTS.md` content for MCP discovery
   - Emits `module.registered` event
5. Registry is stored as a singleton, accessible throughout the app

### module.json Schema

```json
{
  "id": "blog",
  "name": "Blog",
  "version": "1.0.0",
  "description": "Content publishing with posts, comments, and tags",
  "enabled": true,
  "dependencies": [],
  "entities": ["post", "comment"],
  "events": {
    "publishes": ["post.created", "post.published", "post.updated", "post.deleted", "comment.created", "comment.approved"],
    "subscribes": []
  },
  "dataLayer": {
    "post.created": {
      "event": "content_created",
      "params": ["post_id", "post_title", "author"]
    },
    "post.published": {
      "event": "content_published",
      "params": ["post_id", "post_title", "author", "tags"]
    },
    "post.viewed": {
      "event": "post_viewed",
      "params": ["post_id", "post_title", "categories"]
    },
    "comment.created": {
      "event": "comment_submitted",
      "params": ["post_id", "comment_length"]
    }
  }
}
```

### Dynamic API Routing

A catch-all route at `/api/modules/[...path]/route.ts` resolves incoming requests:

1. Extract module name from first path segment: `/api/modules/blog/posts` → module `blog`, path `posts`
2. Look up module in registry
3. Delegate to the module's registered API handler
4. Return structured JSON response

### Core Interfaces

```ts
interface CortexModule {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  dependencies: string[];
  path: string;                    // filesystem path
  entities: Record<string, any>;   // Drizzle table schemas
  apiHandlers: Record<string, ApiHandler>;
  mcpTools: McpTool[];
  events: EventDefinitions;
  dataLayerMappings: DataLayerMapping[];
  agentsMd: string;               // raw AGENTS.md content
}

interface ModuleRegistry {
  modules: Map<string, CortexModule>;
  register(module: CortexModule): void;
  get(id: string): CortexModule | undefined;
  getAll(): CortexModule[];
  getApiHandler(moduleId: string, path: string): ApiHandler | undefined;
  getAllMcpTools(): McpTool[];
  getAllEntities(): Record<string, any>;
}
```

---

## 2. MCP Server

### Transports

**HTTP** — POST `/api/mcp` handles MCP JSON-RPC requests. Used by web-based AI tools and the admin UI.

**stdio** — `npx cortex mcp` or `node scripts/mcp-stdio.ts` runs a stdio MCP server. Used by Claude Code, Cursor, and other CLI-based AI agents. Configured in the consumer's MCP settings:

```json
{
  "mcpServers": {
    "cortex": {
      "command": "node",
      "args": ["scripts/mcp-stdio.ts"],
      "cwd": "/path/to/cortex"
    }
  }
}
```

### Auto-Generated Entity Tools

For every entity registered by any module, the MCP server generates 5 tools:

| Tool | Description | Input |
|------|-------------|-------|
| `create_{entity}` | Create a new record | Entity fields (validated by Zod) |
| `get_{entity}` | Get record by ID | `{ id: string }` |
| `list_{entity}` | List with filters/pagination | `{ filter?, page?, perPage?, search? }` |
| `update_{entity}` | Update record fields | `{ id: string, ...fields }` |
| `delete_{entity}` | Delete record by ID | `{ id: string }` |

For the blog module this produces: `create_post`, `get_post`, `list_post`, `update_post`, `delete_post`, `create_comment`, `get_comment`, `list_comment`, `update_comment`, `delete_comment`.

### Core Discovery Tools

Always available regardless of installed modules:

| Tool | Description |
|------|-------------|
| `discover_schema` | Search entity schemas by name or keyword. Returns field names, types, and descriptions. |
| `find_api` | Search API endpoints by natural language query. Returns method, path, description, parameters. |
| `list_modules` | List all registered modules with name, version, description, and status. |
| `get_module_spec` | Read a module's AGENTS.md content for detailed understanding. |

### Custom Module Tools

Modules export additional tools from `mcp-tools.ts`:

```ts
// modules/blog/mcp-tools.ts
import type { McpTool } from "@/core/types";

export const tools: McpTool[] = [
  {
    name: "publish_post",
    description: "Publish a draft post, optionally at a scheduled time",
    inputSchema: { postId: "string", publishAt: "string (ISO date, optional)" },
    handler: async ({ postId, publishAt }) => { /* ... */ }
  },
  {
    name: "search_posts",
    description: "Full-text search across post titles and content",
    inputSchema: { query: "string", limit: "number (default 10)" },
    handler: async ({ query, limit }) => { /* ... */ }
  }
];
```

### Response Format

All MCP tool responses follow a consistent structure:

```ts
interface ToolResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    aiHint?: string;    // guidance for AI to fix the error
  };
  metadata?: {
    total?: number;
    page?: number;
    perPage?: number;
    executionTimeMs?: number;
  };
}
```

---

## 3. GTM Data Layer

### Architecture

```
Module Event (server) → Event Bus → Data Layer Service → SSR response header / API response
                                                              ↓
Client: DataLayerProvider component → reads events → pushes to window.dataLayer
                                                              ↓
                                                    Google Tag Manager
```

### Implementation

**Server side:**
- `DataLayerService` subscribes to the event bus
- Filters events through module `dataLayer` mappings in `module.json`
- Transforms domain events into GTM-compatible data layer objects
- Attaches pending data layer events to the request/response context

**Client side:**
- `DataLayerProvider` (client component) in root layout:
  - Initializes `window.dataLayer = window.dataLayer || []`
  - Reads server-provided events from a serialized prop
  - Pushes them to `window.dataLayer`
  - Exposes a `pushEvent(event)` function via React context for client-side events
- `GTMScript` component injects the GTM container snippet if `NEXT_PUBLIC_GTM_ID` is set

### Auto-Tracked Events

These fire automatically with no module configuration needed:

| Event | Trigger | Parameters |
|-------|---------|------------|
| `page_view` | Every page navigation | `page_path`, `page_title`, `content_type`, `module` |
| `user_signup` | User registration | `method` |
| `user_login` | User login | `method` |
| `search` | Search query | `search_term`, `results_count` |

### Module-Declared Events

Modules declare which domain events map to data layer pushes via `module.json` `dataLayer` field. The blog module maps:

| Domain Event | Data Layer Event | Parameters |
|--------------|-----------------|------------|
| `post.created` | `content_created` | `post_id`, `post_title`, `author` |
| `post.published` | `content_published` | `post_id`, `post_title`, `author`, `tags` |
| `post.viewed` | `post_viewed` | `post_id`, `post_title`, `categories` (client-side event, pushed by blog page component) |
| `comment.created` | `comment_submitted` | `post_id`, `comment_length` |

### Client-Side Push API

Components can push custom events:

```tsx
import { useDataLayer } from "@/components/DataLayerProvider";

function ShareButton({ postId, platform }) {
  const { pushEvent } = useDataLayer();

  return (
    <button onClick={() => {
      pushEvent({ event: "share", post_id: postId, platform });
      // ... share logic
    }}>
      Share
    </button>
  );
}
```

### GTM Setup

Set `NEXT_PUBLIC_GTM_ID=GTM-XXXXXX` in environment variables. The GTM container script is injected automatically. No GTM ID = no script injected (development-friendly).

---

## 4. Event Bus

### Design

In-process pub/sub for the MVP. Synchronous-first (handlers run in sequence), with events stored in a PostgreSQL `events` table for replay and audit.

```ts
interface DomainEvent {
  id: string;           // UUID
  type: string;         // e.g., "post.created"
  module: string;       // source module ID
  payload: Record<string, any>;
  metadata: {
    timestamp: Date;
    correlationId?: string;
  };
}

interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventType: string, handler: EventHandler): void;
  subscribeAll(handler: EventHandler): void;  // for data layer service
  getHistory(filter: EventFilter): Promise<DomainEvent[]>;
}
```

### Flow

1. Module calls `eventBus.publish({ type: "post.created", ... })`
2. Event stored in `events` table
3. All subscribers for `post.created` are called
4. `subscribeAll` listeners (data layer service) receive every event

---

## 5. Blog Module

### Entities

**Post:**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key, auto-generated |
| title | varchar(255) | Required |
| slug | varchar(255) | Unique, auto-generated from title |
| content | text | Markdown |
| excerpt | varchar(500) | Auto-generated from content if empty |
| status | enum | `draft`, `published`, `archived` |
| author | varchar(100) | Author name |
| tags | jsonb | String array |
| metadata | jsonb | Arbitrary key-value pairs |
| publishedAt | timestamp | Set when status → published |
| createdAt | timestamp | Auto |
| updatedAt | timestamp | Auto |

**Comment:**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key, auto-generated |
| postId | UUID | Foreign key to Post |
| parentId | UUID | Nullable, for threaded comments |
| authorName | varchar(100) | Required |
| authorEmail | varchar(255) | Required |
| content | text | Required |
| status | enum | `pending`, `approved`, `spam` |
| createdAt | timestamp | Auto |

### API Handlers

All return `ToolResponse` format. Handlers are plain async functions (not Next.js route handlers) — the dynamic catch-all route delegates to them:

```ts
// modules/blog/api/posts.ts
export const handlers = {
  "GET /":      listPosts,      // ?status=published&tag=ai&search=framework&page=1&perPage=10
  "POST /":     createPost,
  "GET /:id":   getPost,
  "PUT /:id":   updatePost,
  "DELETE /:id": deletePost,
  "POST /:id/publish": publishPost,
};
```

### Events

```ts
// modules/blog/events.ts
export const events = {
  publishes: ["post.created", "post.published", "post.updated", "post.deleted", "comment.created", "comment.approved"],
  subscribers: {
    "post.created": async (event) => {
      // Auto-generate excerpt if not provided
    }
  }
};
```

### AGENTS.md

The blog module includes a comprehensive AGENTS.md documenting all entities, APIs, events, MCP tools, permissions, and common AI tasks — following the format from the architecture document.

---

## 6. Tech Stack

| Layer | Choice | Version |
|-------|--------|---------|
| Runtime | Node.js | 25.x (installed) |
| Framework | Next.js App Router | 15.x |
| Language | TypeScript (strict) | 5.x |
| Database | PostgreSQL | 16 (via Docker) |
| ORM | Drizzle ORM | latest |
| MCP SDK | @modelcontextprotocol/sdk | latest |
| Validation | Zod | latest |
| Styling | Tailwind CSS | 4.x |
| Package manager | npm | 11.x |
| Container | Docker Compose | PostgreSQL + Redis |

---

## 7. Environment Variables

```env
# Database
DATABASE_URL=postgresql://cortex:cortex@localhost:5432/cortex

# Redis (for event bus, optional in MVP)
REDIS_URL=redis://localhost:6379

# GTM (optional — no ID = no GTM script)
NEXT_PUBLIC_GTM_ID=

# AI Theme Generation (optional — no key = copy default theme without AI customization)
ANTHROPIC_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 8. Theme System

### Overview

The theme system is what makes Cortex deliver on the "WordPress for AI era" promise. Users describe their website in plain English, AI generates a complete professional theme.

**User journey:** Clone repo → write layout description → `npm run theme:generate` → `npm run dev` → professional website in <30 minutes.

### Architecture

```
src/core/
├── theme-registry.ts      # Theme discovery (scans /themes like /modules)
└── theme-types.ts          # ThemeConfig, Theme, LayoutInstructions interfaces

themes/
├── default/                # Professional default theme (Tailwind UI quality)
│   ├── theme.json          # Design tokens (colors, typography, spacing, shadows)
│   ├── components/
│   │   ├── Button.tsx      # Primary, Secondary, Outline, Ghost variants
│   │   ├── Card.tsx        # Elevation shadows, hover effects
│   │   ├── Header.tsx      # Fixed/static, logo left/center, nav horizontal
│   │   ├── Footer.tsx      # 1-4 columns, social icons, newsletter
│   │   ├── Hero.tsx        # Full/half-screen, split layout, CTA
│   │   ├── Section.tsx     # Background variants, spacing
│   │   └── Container.tsx   # Max-width, responsive padding
│   ├── layouts/
│   │   ├── BaseLayout.tsx
│   │   ├── LandingLayout.tsx
│   │   └── BlogLayout.tsx
│   └── styles/
│       └── theme.css       # CSS variables, animations, utilities
│
scripts/
├── generate-theme.ts       # CLI: npm run theme:generate
└── quickstart.ts           # Interactive wizard (bonus)

.cortex/
└── layout-instructions.example.md  # 3+ clear examples
```

### ThemeRegistry

Mirrors ModuleRegistry pattern:

1. Scans `/themes` directory on boot
2. Reads `theme.json` from each subdirectory
3. Loads components and layouts
4. Tracks active theme (from DB/config)
5. Provides `getComponent(name)` and `getLayout(name)` with fallback to default theme

### ThemeConfig (theme.json)

```json
{
  "id": "cortex-default",
  "name": "Cortex Default",
  "version": "1.0.0",
  "description": "Professional default theme",
  "tokens": {
    "colors": {
      "primary": "#0066FF",
      "secondary": "#6366F1",
      "accent": "#F59E0B",
      "background": "#FFFFFF",
      "text": "#1F2937",
      "muted": "#6B7280"
    },
    "typography": {
      "fontFamily": {
        "sans": "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        "mono": "'JetBrains Mono', 'Fira Code', monospace"
      },
      "fontSize": { "xs": "0.75rem", "sm": "0.875rem", "base": "1rem", "lg": "1.125rem", "xl": "1.25rem", "2xl": "1.5rem", "3xl": "1.875rem", "4xl": "2.25rem" }
    },
    "spacing": { "xs": "0.5rem", "sm": "1rem", "md": "1.5rem", "lg": "2rem", "xl": "3rem", "2xl": "4rem" },
    "borderRadius": { "none": "0", "sm": "0.25rem", "md": "0.5rem", "lg": "1rem", "full": "9999px" },
    "shadows": { "sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)", "md": "0 4px 6px -1px rgb(0 0 0 / 0.1)", "lg": "0 10px 15px -3px rgb(0 0 0 / 0.1)" }
  },
  "components": {
    "Button": "./components/Button.tsx",
    "Card": "./components/Card.tsx",
    "Header": "./components/Header.tsx",
    "Footer": "./components/Footer.tsx",
    "Hero": "./components/Hero.tsx",
    "Section": "./components/Section.tsx",
    "Container": "./components/Container.tsx"
  },
  "layouts": {
    "default": "./layouts/BaseLayout.tsx",
    "landing": "./layouts/LandingLayout.tsx",
    "blog": "./layouts/BlogLayout.tsx"
  }
}
```

### Default Theme Quality Requirements

- **Reference level:** Tailwind UI, shadcn/ui, Vercel templates
- **Responsive:** Mobile-first with tablet/desktop breakpoints
- **Accessible:** ARIA labels, keyboard navigation, focus states
- **Polished:** Hover effects, transitions, loading states
- **Consistent:** All styling via CSS variables from design tokens
- **Modern:** Tailwind CSS, TypeScript strict, clean code

### AI Theme Generator

**MCP tool:** `generate_theme_from_description`

1. User provides plain-text layout description
2. Claude API parses description into structured `LayoutInstructions` (header style, hero type, sections, footer, design tokens)
3. Copies default theme as base
4. Customizes `theme.json` with parsed design tokens
5. Customizes components based on layout instructions
6. Generates layouts matching described structure
7. Writes complete theme to `/themes/{name}`

**CLI wrapper:**
```bash
npm run theme:generate -- --file .cortex/my-layout.md --name my-site
npm run theme:activate my-site
```

**Fallback:** If no `ANTHROPIC_API_KEY`, copies default theme without AI customization.

### Integration with Next.js

- Root `layout.tsx` wraps children in `<ThemeProvider>`
- ThemeProvider injects CSS variables from active theme's tokens
- Pages use `getComponent()` and `getLayout()` from theme registry
- Theme components override core components when same name exists

### LayoutInstructions (parsed from description)

```ts
interface LayoutInstructions {
  structure: {
    header: { style: 'fixed' | 'static' | 'transparent'; logo: 'left' | 'center'; navigation: 'horizontal' | 'vertical' };
    hero?: { type: 'full-screen' | 'half-screen' | 'banner'; content: 'left' | 'center' | 'right'; background: 'color' | 'image' | 'gradient' };
    sections: Array<{ type: 'features' | 'testimonials' | 'cta' | 'content' | 'gallery'; layout: '1-col' | '2-col' | '3-col' | 'grid' }>;
    footer: { columns: 1 | 2 | 3 | 4; social: boolean; newsletter: boolean };
  };
  design: {
    colorScheme: 'light' | 'dark' | 'auto';
    primaryColor?: string;
    font?: string;
    spacing: 'compact' | 'comfortable' | 'spacious';
    corners: 'sharp' | 'rounded' | 'pill';
  };
}
```

---

## 9. What's Scaffolded But Not Implemented

These exist as directories, interfaces, or TODO comments — ready for future development:

- `/plugins` — empty directory, discovery already scans it
- `/themes` — empty directory
- Multi-tenancy — interfaces defined in `types.ts` but no tenant isolation
- Field-level encryption — mentioned in types, not implemented
- RBAC — no permission system, all APIs are open
- Admin UI — basic shell page, no full admin interface
- AI chat assistant — not included in MVP
- Meilisearch — not included, search is basic SQL LIKE/ILIKE
- Redis event pub/sub — event bus is in-process only

---

## 9. Success Criteria

The MVP is done when:

### Core Framework
1. `docker compose up -d` starts PostgreSQL and Redis
2. `npm run dev` starts Next.js with module and theme discovery
3. Blog module is auto-discovered — posts and comments tables created
4. All blog CRUD API endpoints work at `/api/modules/blog/posts`

### MCP Server
5. MCP server works via both HTTP (`/api/mcp`) and stdio (`scripts/mcp-stdio.ts`)
6. AI agent (Claude Code) can discover schemas, list modules, create/read/update/delete posts through MCP
7. `generate_theme_from_description` MCP tool works

### GTM Data Layer
8. `window.dataLayer` receives events when posts are created/published/viewed
9. GTM script loads when `NEXT_PUBLIC_GTM_ID` is set

### Theme System (CRITICAL)
10. Default theme loads with professional Tailwind UI-quality components (7+ components, 3 layouts)
11. `npm run theme:generate -- --file .cortex/my-layout.md --name test` generates a complete theme
12. `npm run theme:activate test` switches the active theme
13. Homepage renders with active theme's layout and components
14. Blog frontend pages render posts using theme components

### Documentation
15. `AGENTS.md` exists at root and in blog module
16. `.cortex/layout-instructions.example.md` with 3+ clear examples
17. README with Quick Start: clone → describe → generate → run in <30 minutes

### The Ultimate Test
A non-technical user can clone the repo and have a professional-looking website running in <30 minutes.
