# Cortex MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working AI-first web framework MVP with module auto-discovery, MCP server, GTM data layer, theme system, and a blog module as proof.

**Architecture:** Next.js 15 App Router monorepo. Custom module/theme discovery at boot time scans `/modules` and `/themes` directories. MCP server auto-generates CRUD tools for every discovered entity. Event bus bridges domain events to GTM data layer. Theme system with AI generation enables clone-to-website in <30 minutes.

**Tech Stack:** Node.js 25, Next.js 15, TypeScript strict, PostgreSQL 16 (Docker), Drizzle ORM, @modelcontextprotocol/sdk, Zod, Tailwind CSS 4, Redis (Docker)

**Spec:** `docs/superpowers/specs/2026-03-27-cortex-mvp-design.md`

**Working directory:** `/Users/krzysztofmoor/Documents/cortex`

---

## File Map

### Core Framework (`src/core/`)
| File | Responsibility |
|------|---------------|
| `types.ts` | All shared interfaces: CortexModule, ApiHandler, McpTool, DomainEvent, ToolResponse, DataLayerMapping, EventDefinitions |
| `event-bus.ts` | In-process pub/sub with PostgreSQL persistence. publish(), subscribe(), subscribeAll(), getHistory() |
| `module-registry.ts` | Scans `/modules` + `/plugins`, reads module.json, loads entities/api/mcp/events, topological sort |
| `mcp-server.ts` | MCP server class: auto-generates entity CRUD tools, registers discovery tools, registers module custom tools |
| `data-layer.ts` | Subscribes to event bus, maps domain events to GTM dataLayer pushes via module.json mappings |
| `theme-types.ts` | ThemeConfig, Theme, LayoutInstructions interfaces |
| `theme-registry.ts` | Scans `/themes`, reads theme.json, tracks active theme, getComponent/getLayout with fallback |

### Next.js App (`src/app/`)
| File | Responsibility |
|------|---------------|
| `layout.tsx` | Root layout: ThemeProvider, DataLayerProvider, GTMScript, Inter font |
| `page.tsx` | Homepage: renders active theme's LandingLayout with Hero + features |
| `globals.css` | Tailwind base imports + CSS variable injection point |
| `api/health/route.ts` | GET /api/health — returns status of db, modules, themes |
| `api/modules/[...path]/route.ts` | Catch-all: extracts module+path, delegates to module API handler |
| `api/mcp/route.ts` | POST /api/mcp — MCP HTTP transport (JSON-RPC) |
| `blog/page.tsx` | Blog post list page using theme components |
| `blog/[slug]/page.tsx` | Single blog post page using theme components |
| `admin/layout.tsx` | Admin layout shell |
| `admin/page.tsx` | Admin dashboard: lists modules, themes, recent events |

### Components (`src/components/`)
| File | Responsibility |
|------|---------------|
| `DataLayerProvider.tsx` | Client component: initializes window.dataLayer, context with pushEvent() |
| `GTMScript.tsx` | Client component: injects GTM container snippet if NEXT_PUBLIC_GTM_ID set |
| `ThemeProvider.tsx` | Server component: injects CSS variables from active theme tokens |

### Library (`src/lib/`)
| File | Responsibility |
|------|---------------|
| `db.ts` | Drizzle PostgreSQL client + connection pool |
| `env.ts` | Zod-validated environment variables |

### Blog Module (`modules/blog/`)
| File | Responsibility |
|------|---------------|
| `module.json` | Module metadata: id, name, version, entities, events, dataLayer mappings |
| `AGENTS.md` | AI-readable documentation of blog module |
| `entities/post.ts` | Drizzle schema for posts table |
| `entities/comment.ts` | Drizzle schema for comments table |
| `api/posts.ts` | CRUD handlers: list, create, get, update, delete, publish |
| `api/comments.ts` | CRUD handlers: list, create, get, update, delete |
| `events.ts` | Event definitions + subscriber for auto-excerpt generation |
| `mcp-tools.ts` | Custom MCP tools: publish_post, search_posts |
| `components/PostCard.tsx` | Post card component for blog list page |

### Default Theme (`themes/default/`)
| File | Responsibility |
|------|---------------|
| `theme.json` | Design tokens: colors, typography, spacing, borderRadius, shadows |
| `components/Button.tsx` | Primary, Secondary, Outline, Ghost variants; sm/md/lg sizes |
| `components/Card.tsx` | Content card with elevation, hover effects |
| `components/Header.tsx` | Fixed/static header, logo left, horizontal nav, CTA button |
| `components/Footer.tsx` | 1-4 column footer, social icons, newsletter, copyright |
| `components/Hero.tsx` | Full/half-screen, center/split layout, gradient background, CTA |
| `components/Section.tsx` | Content section with title, subtitle, bg variants, padding |
| `components/Container.tsx` | Max-width container with responsive padding |
| `layouts/BaseLayout.tsx` | Header + children + Footer |
| `layouts/LandingLayout.tsx` | Header + Hero + sections + Footer |
| `layouts/BlogLayout.tsx` | Header + sidebar + content area + Footer |
| `styles/theme.css` | CSS custom properties from tokens, transitions, utilities |

### Scripts (`scripts/`)
| File | Responsibility |
|------|---------------|
| `mcp-stdio.ts` | stdio MCP entry point for Claude Code / Cursor |
| `generate-theme.ts` | CLI: parse description via Claude API, generate theme files |
| `seed.ts` | Seed database with sample posts and comments |

### Root Files
| File | Responsibility |
|------|---------------|
| `package.json` | Dependencies, scripts (dev, build, theme:generate, theme:activate, seed, mcp) |
| `tsconfig.json` | TypeScript strict config with path aliases |
| `next.config.ts` | Next.js config: server external packages for drizzle/pg |
| `docker-compose.yml` | PostgreSQL 16 + Redis 7 |
| `drizzle.config.ts` | Drizzle Kit config for migrations |
| `.env.example` | All env vars with defaults |
| `.gitignore` | node_modules, .env.local, .next, drizzle output |
| `AGENTS.md` | Root AI guide: framework overview, module system, MCP tools |
| `README.md` | Quick Start guide: clone → describe → generate → run in <30 min |
| `.cortex/layout-instructions.example.md` | 3 layout description examples |
| `src/instrumentation.ts` | Next.js instrumentation: boots module registry + theme registry |

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `src/lib/env.ts`
- Create: `src/app/globals.css`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "cortex",
  "version": "0.1.0",
  "private": true,
  "description": "AI-First Web Framework",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "seed": "tsx scripts/seed.ts",
    "mcp": "tsx scripts/mcp-stdio.ts",
    "theme:generate": "tsx scripts/generate-theme.ts generate",
    "theme:activate": "tsx scripts/generate-theme.ts activate",
    "theme:list": "tsx scripts/generate-theme.ts list"
  },
  "dependencies": {
    "next": "^15.3.2",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "@modelcontextprotocol/sdk": "^1.12.1",
    "drizzle-orm": "^0.44.2",
    "postgres": "^3.4.7",
    "zod": "^3.24.4",
    "uuid": "^11.1.0",
    "commander": "^13.1.0"
  },
  "devDependencies": {
    "@types/node": "^22.15.3",
    "@types/react": "^19.1.2",
    "@types/react-dom": "^19.1.2",
    "@types/uuid": "^10.0.0",
    "typescript": "^5.8.3",
    "drizzle-kit": "^0.31.1",
    "@tailwindcss/postcss": "^4.1.4",
    "tailwindcss": "^4.1.4",
    "tsx": "^4.19.4",
    "postcss": "^8.5.3"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@modules/*": ["./modules/*"],
      "@themes/*": ["./themes/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create next.config.ts**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["postgres"],
};

export default nextConfig;
```

- [ ] **Step 4: Create docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: cortex
      POSTGRES_PASSWORD: cortex
      POSTGRES_DB: cortex
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

- [ ] **Step 5: Create .env.example**

```env
# Database
DATABASE_URL=postgresql://cortex:cortex@localhost:5432/cortex

# Redis (optional in MVP)
REDIS_URL=redis://localhost:6379

# GTM (optional — no ID = no GTM script injected)
NEXT_PUBLIC_GTM_ID=

# AI Theme Generation (optional — no key = copies default theme without AI customization)
ANTHROPIC_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

- [ ] **Step 6: Create .gitignore**

```
node_modules/
.next/
.env.local
.env
*.tsbuildinfo
drizzle/meta/
```

- [ ] **Step 7: Create drizzle.config.ts**

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: ["./src/lib/schema.ts", "./modules/*/entities/*.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://cortex:cortex@localhost:5432/cortex",
  },
});
```

- [ ] **Step 8: Create src/lib/env.ts**

```ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default("postgresql://cortex:cortex@localhost:5432/cortex"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  NEXT_PUBLIC_GTM_ID: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = envSchema.parse(process.env);
```

- [ ] **Step 9: Create src/app/globals.css**

```css
@import "tailwindcss";
```

- [ ] **Step 10: Create postcss.config.mjs**

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- [ ] **Step 11: Install dependencies and verify**

Run: `cd /Users/krzysztofmoor/Documents/cortex && npm install`
Expected: Clean install, no errors.

Run: `cp .env.example .env.local`

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: project scaffold with Next.js 15, Drizzle, Docker, Tailwind"
```

---

## Task 2: Core Types

**Files:**
- Create: `src/core/types.ts`
- Create: `src/core/theme-types.ts`

- [ ] **Step 1: Create src/core/types.ts**

```ts
import type { NextRequest } from "next/server";

// ─── Domain Events ───

export interface DomainEvent {
  id: string;
  type: string;
  module: string;
  payload: Record<string, unknown>;
  metadata: {
    timestamp: Date;
    correlationId?: string;
  };
}

export type EventHandler = (event: DomainEvent) => Promise<void>;

export interface EventFilter {
  type?: string;
  module?: string;
  since?: Date;
  limit?: number;
}

export interface EventDefinitions {
  publishes: string[];
  subscribers: Record<string, EventHandler>;
}

// ─── API ───

export interface ApiContext {
  params: Record<string, string>;
  searchParams: Record<string, string>;
  body?: unknown;
}

export type ApiHandler = (ctx: ApiContext) => Promise<ToolResponse>;

// ─── Tool Response (shared by API + MCP) ───

export interface ToolResponse {
  success: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
    aiHint?: string;
  };
  metadata?: {
    total?: number;
    page?: number;
    perPage?: number;
    executionTimeMs?: number;
  };
}

// ─── Data Layer ───

export interface DataLayerMapping {
  domainEvent: string;
  dataLayerEvent: string;
  params: string[];
}

export interface DataLayerPush {
  event: string;
  [key: string]: unknown;
}

// ─── MCP Tools ───

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (input: Record<string, unknown>) => Promise<ToolResponse>;
}

// ─── Module ───

export interface ModuleManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  dependencies: string[];
  entities: string[];
  events: {
    publishes: string[];
    subscribes: string[];
  };
  dataLayer: Record<string, { event: string; params: string[] }>;
}

export interface CortexModule {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  dependencies: string[];
  path: string;
  entities: Record<string, unknown>;
  apiHandlers: Record<string, ApiHandler>;
  mcpTools: McpTool[];
  events: EventDefinitions;
  dataLayerMappings: DataLayerMapping[];
  agentsMd: string;
}
```

- [ ] **Step 2: Create src/core/theme-types.ts**

```ts
export interface ThemeTokens {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
  };
  typography: {
    fontFamily: {
      sans: string;
      serif?: string;
      mono?: string;
    };
    fontSize: Record<string, string>;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
}

export interface ThemeConfig {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  tokens: ThemeTokens;
  components: Record<string, string>;
  layouts: Record<string, string>;
}

export interface Theme {
  config: ThemeConfig;
  path: string;
  active: boolean;
}

export interface LayoutInstructions {
  structure: {
    header: {
      style: "fixed" | "static" | "transparent";
      logo: "left" | "center";
      navigation: "horizontal" | "vertical";
    };
    hero?: {
      type: "full-screen" | "half-screen" | "banner";
      content: "left" | "center" | "right";
      background: "color" | "image" | "gradient";
    };
    sections: Array<{
      type: "features" | "testimonials" | "cta" | "content" | "gallery";
      layout: "1-col" | "2-col" | "3-col" | "grid";
    }>;
    footer: {
      columns: 1 | 2 | 3 | 4;
      social: boolean;
      newsletter: boolean;
    };
  };
  design: {
    colorScheme: "light" | "dark" | "auto";
    primaryColor?: string;
    font?: string;
    spacing: "compact" | "comfortable" | "spacious";
    corners: "sharp" | "rounded" | "pill";
  };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors from these two files (Next.js types may not resolve yet until first `next dev`, that's fine).

- [ ] **Step 4: Commit**

```bash
git add src/core/types.ts src/core/theme-types.ts
git commit -m "feat: core type definitions for modules, events, MCP, themes"
```

---

## Task 3: Database Layer

**Files:**
- Create: `src/lib/db.ts`
- Create: `src/lib/schema.ts`

- [ ] **Step 1: Create src/lib/db.ts**

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "postgresql://cortex:cortex@localhost:5432/cortex";

const client = postgres(connectionString);
export const db = drizzle(client);
```

- [ ] **Step 2: Create src/lib/schema.ts**

This is the core `events` table used by the event bus.

```ts
import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),
  module: text("module").notNull(),
  payload: jsonb("payload").notNull().$type<Record<string, unknown>>(),
  correlationId: text("correlation_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 3: Start Docker and generate migration**

Run: `cd /Users/krzysztofmoor/Documents/cortex && docker compose up -d`
Expected: PostgreSQL and Redis containers start.

Run: `npx drizzle-kit generate`
Expected: Migration file created in `drizzle/` directory.

Run: `npx drizzle-kit migrate`
Expected: `events` table created in PostgreSQL.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db.ts src/lib/schema.ts drizzle/ drizzle.config.ts
git commit -m "feat: database layer with Drizzle ORM and events table"
```

---

## Task 4: Event Bus

**Files:**
- Create: `src/core/event-bus.ts`

- [ ] **Step 1: Create src/core/event-bus.ts**

```ts
import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { events as eventsTable } from "@/lib/schema";
import { desc, eq, and, gte } from "drizzle-orm";
import type { DomainEvent, EventHandler, EventFilter } from "./types";

class EventBusImpl {
  private subscribers = new Map<string, EventHandler[]>();
  private allSubscribers: EventHandler[] = [];

  subscribe(eventType: string, handler: EventHandler): void {
    const existing = this.subscribers.get(eventType) ?? [];
    existing.push(handler);
    this.subscribers.set(eventType, existing);
  }

  subscribeAll(handler: EventHandler): void {
    this.allSubscribers.push(handler);
  }

  async publish(event: Omit<DomainEvent, "id" | "metadata"> & { metadata?: Partial<DomainEvent["metadata"]> }): Promise<DomainEvent> {
    const fullEvent: DomainEvent = {
      id: uuid(),
      type: event.type,
      module: event.module,
      payload: event.payload,
      metadata: {
        timestamp: new Date(),
        correlationId: event.metadata?.correlationId,
      },
    };

    // Persist to database
    await db.insert(eventsTable).values({
      id: fullEvent.id,
      type: fullEvent.type,
      module: fullEvent.module,
      payload: fullEvent.payload,
      correlationId: fullEvent.metadata.correlationId ?? null,
    });

    // Notify specific subscribers
    const handlers = this.subscribers.get(fullEvent.type) ?? [];
    for (const handler of handlers) {
      try {
        await handler(fullEvent);
      } catch (err) {
        console.error(`Event handler error for ${fullEvent.type}:`, err);
      }
    }

    // Notify subscribeAll listeners
    for (const handler of this.allSubscribers) {
      try {
        await handler(fullEvent);
      } catch (err) {
        console.error(`Global event handler error for ${fullEvent.type}:`, err);
      }
    }

    return fullEvent;
  }

  async getHistory(filter: EventFilter = {}): Promise<DomainEvent[]> {
    const conditions = [];
    if (filter.type) conditions.push(eq(eventsTable.type, filter.type));
    if (filter.module) conditions.push(eq(eventsTable.module, filter.module));
    if (filter.since) conditions.push(gte(eventsTable.createdAt, filter.since));

    const rows = await db
      .select()
      .from(eventsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(eventsTable.createdAt))
      .limit(filter.limit ?? 100);

    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      module: row.module,
      payload: row.payload,
      metadata: {
        timestamp: row.createdAt,
        correlationId: row.correlationId ?? undefined,
      },
    }));
  }
}

export const eventBus = new EventBusImpl();
```

- [ ] **Step 2: Commit**

```bash
git add src/core/event-bus.ts
git commit -m "feat: event bus with PostgreSQL persistence and pub/sub"
```

---

## Task 5: Blog Module Entities

**Files:**
- Create: `modules/blog/module.json`
- Create: `modules/blog/entities/post.ts`
- Create: `modules/blog/entities/comment.ts`

- [ ] **Step 1: Create modules/blog/module.json**

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
    "publishes": [
      "post.created",
      "post.published",
      "post.updated",
      "post.deleted",
      "comment.created",
      "comment.approved"
    ],
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
    "comment.created": {
      "event": "comment_submitted",
      "params": ["post_id", "comment_length"]
    }
  }
}
```

- [ ] **Step 2: Create modules/blog/entities/post.ts**

```ts
import { pgTable, uuid, varchar, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const posts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content").notNull().default(""),
  excerpt: varchar("excerpt", { length: 500 }),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  author: varchar("author", { length: 100 }).notNull().default("Anonymous"),
  tags: jsonb("tags").notNull().$type<string[]>().default([]),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 3: Create modules/blog/entities/comment.ts**

```ts
import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { posts } from "./post";

export const comments = pgTable("blog_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id"),
  authorName: varchar("author_name", { length: 100 }).notNull(),
  authorEmail: varchar("author_email", { length: 255 }).notNull(),
  content: text("content").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 4: Generate and run migration for blog entities**

Run: `npx drizzle-kit generate`
Run: `npx drizzle-kit migrate`
Expected: `blog_posts` and `blog_comments` tables created.

- [ ] **Step 5: Commit**

```bash
git add modules/blog/ drizzle/
git commit -m "feat: blog module entities (posts + comments) with Drizzle schemas"
```

---

## Task 6: Blog Module API Handlers

**Files:**
- Create: `modules/blog/api/posts.ts`
- Create: `modules/blog/api/comments.ts`

- [ ] **Step 1: Create modules/blog/api/posts.ts**

```ts
import { db } from "@/lib/db";
import { posts } from "../entities/post";
import { eq, ilike, desc, and, sql } from "drizzle-orm";
import { eventBus } from "@/core/event-bus";
import type { ApiHandler, ToolResponse } from "@/core/types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const listPosts: ApiHandler = async (ctx) => {
  const { status, tag, search, page = "1", perPage = "10" } = ctx.searchParams;
  const pageNum = parseInt(page, 10);
  const limit = parseInt(perPage, 10);
  const offset = (pageNum - 1) * limit;

  const conditions = [];
  if (status) conditions.push(eq(posts.status, status));
  if (search) conditions.push(ilike(posts.title, `%${search}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db.select().from(posts).where(where).orderBy(desc(posts.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(posts).where(where),
  ]);

  // Filter by tag in application layer (JSONB array contains)
  const filtered = tag ? rows.filter((r) => r.tags.includes(tag)) : rows;

  return {
    success: true,
    data: filtered,
    metadata: { total: Number(countResult[0].count), page: pageNum, perPage: limit },
  };
};

const createPost: ApiHandler = async (ctx) => {
  const body = ctx.body as { title: string; content?: string; excerpt?: string; author?: string; tags?: string[]; status?: string };
  if (!body?.title) {
    return { success: false, error: { code: "VALIDATION", message: "title is required", aiHint: "Provide a title field in the request body." } };
  }

  const slug = slugify(body.title) + "-" + Date.now().toString(36);
  const excerpt = body.excerpt || (body.content ? body.content.slice(0, 200) : "");

  const [post] = await db
    .insert(posts)
    .values({
      title: body.title,
      slug,
      content: body.content ?? "",
      excerpt,
      author: body.author ?? "Anonymous",
      tags: body.tags ?? [],
      status: body.status ?? "draft",
    })
    .returning();

  await eventBus.publish({ type: "post.created", module: "blog", payload: { post_id: post.id, post_title: post.title, author: post.author } });

  return { success: true, data: post };
};

const getPost: ApiHandler = async (ctx) => {
  const { id } = ctx.params;
  const [post] = await db.select().from(posts).where(eq(posts.id, id));
  if (!post) return { success: false, error: { code: "NOT_FOUND", message: `Post ${id} not found` } };
  return { success: true, data: post };
};

const updatePost: ApiHandler = async (ctx) => {
  const { id } = ctx.params;
  const body = ctx.body as Partial<{ title: string; content: string; excerpt: string; author: string; tags: string[]; status: string }>;

  const [post] = await db
    .update(posts)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(posts.id, id))
    .returning();

  if (!post) return { success: false, error: { code: "NOT_FOUND", message: `Post ${id} not found` } };

  await eventBus.publish({ type: "post.updated", module: "blog", payload: { post_id: post.id, post_title: post.title } });

  return { success: true, data: post };
};

const deletePost: ApiHandler = async (ctx) => {
  const { id } = ctx.params;
  const [post] = await db.delete(posts).where(eq(posts.id, id)).returning();
  if (!post) return { success: false, error: { code: "NOT_FOUND", message: `Post ${id} not found` } };

  await eventBus.publish({ type: "post.deleted", module: "blog", payload: { post_id: post.id, post_title: post.title } });

  return { success: true, data: { deleted: true, id: post.id } };
};

const publishPost: ApiHandler = async (ctx) => {
  const { id } = ctx.params;
  const [post] = await db
    .update(posts)
    .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
    .where(eq(posts.id, id))
    .returning();

  if (!post) return { success: false, error: { code: "NOT_FOUND", message: `Post ${id} not found` } };

  await eventBus.publish({ type: "post.published", module: "blog", payload: { post_id: post.id, post_title: post.title, author: post.author, tags: post.tags } });

  return { success: true, data: post };
};

export const handlers: Record<string, ApiHandler> = {
  "GET /": listPosts,
  "POST /": createPost,
  "GET /:id": getPost,
  "PUT /:id": updatePost,
  "DELETE /:id": deletePost,
  "POST /:id/publish": publishPost,
};
```

- [ ] **Step 2: Create modules/blog/api/comments.ts**

```ts
import { db } from "@/lib/db";
import { comments } from "../entities/comment";
import { eq, desc, sql } from "drizzle-orm";
import { eventBus } from "@/core/event-bus";
import type { ApiHandler } from "@/core/types";

const listComments: ApiHandler = async (ctx) => {
  const { postId, status, page = "1", perPage = "20" } = ctx.searchParams;
  const pageNum = parseInt(page, 10);
  const limit = parseInt(perPage, 10);
  const offset = (pageNum - 1) * limit;

  const where = postId ? eq(comments.postId, postId) : undefined;

  const [rows, countResult] = await Promise.all([
    db.select().from(comments).where(where).orderBy(desc(comments.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(comments).where(where),
  ]);

  return {
    success: true,
    data: rows,
    metadata: { total: Number(countResult[0].count), page: pageNum, perPage: limit },
  };
};

const createComment: ApiHandler = async (ctx) => {
  const body = ctx.body as { postId: string; authorName: string; authorEmail: string; content: string; parentId?: string };
  if (!body?.postId || !body?.authorName || !body?.authorEmail || !body?.content) {
    return { success: false, error: { code: "VALIDATION", message: "postId, authorName, authorEmail, and content are required" } };
  }

  const [comment] = await db
    .insert(comments)
    .values({
      postId: body.postId,
      authorName: body.authorName,
      authorEmail: body.authorEmail,
      content: body.content,
      parentId: body.parentId ?? null,
    })
    .returning();

  await eventBus.publish({
    type: "comment.created",
    module: "blog",
    payload: { post_id: comment.postId, comment_length: comment.content.length },
  });

  return { success: true, data: comment };
};

const getComment: ApiHandler = async (ctx) => {
  const { id } = ctx.params;
  const [comment] = await db.select().from(comments).where(eq(comments.id, id));
  if (!comment) return { success: false, error: { code: "NOT_FOUND", message: `Comment ${id} not found` } };
  return { success: true, data: comment };
};

const updateComment: ApiHandler = async (ctx) => {
  const { id } = ctx.params;
  const body = ctx.body as Partial<{ content: string; status: string }>;
  const [comment] = await db.update(comments).set(body).where(eq(comments.id, id)).returning();
  if (!comment) return { success: false, error: { code: "NOT_FOUND", message: `Comment ${id} not found` } };

  if (body.status === "approved") {
    await eventBus.publish({ type: "comment.approved", module: "blog", payload: { post_id: comment.postId, comment_id: comment.id } });
  }

  return { success: true, data: comment };
};

const deleteComment: ApiHandler = async (ctx) => {
  const { id } = ctx.params;
  const [comment] = await db.delete(comments).where(eq(comments.id, id)).returning();
  if (!comment) return { success: false, error: { code: "NOT_FOUND", message: `Comment ${id} not found` } };
  return { success: true, data: { deleted: true, id: comment.id } };
};

export const handlers: Record<string, ApiHandler> = {
  "GET /": listComments,
  "POST /": createComment,
  "GET /:id": getComment,
  "PUT /:id": updateComment,
  "DELETE /:id": deleteComment,
};
```

- [ ] **Step 3: Commit**

```bash
git add modules/blog/api/
git commit -m "feat: blog module API handlers (posts + comments CRUD)"
```

---

## Task 7: Module Registry + Dynamic API Routing

**Files:**
- Create: `src/core/module-registry.ts`
- Create: `src/app/api/modules/[...path]/route.ts`
- Create: `src/app/api/health/route.ts`
- Create: `src/instrumentation.ts`

- [ ] **Step 1: Create src/core/module-registry.ts**

```ts
import fs from "fs/promises";
import path from "path";
import type { CortexModule, ModuleManifest, ApiHandler, McpTool, DataLayerMapping, EventDefinitions } from "./types";

class ModuleRegistryImpl {
  private modules = new Map<string, CortexModule>();

  async discoverModules(): Promise<void> {
    const scanDirs = [
      path.join(process.cwd(), "modules"),
      path.join(process.cwd(), "plugins"),
    ];

    for (const dir of scanDirs) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          const modulePath = path.join(dir, entry.name);
          await this.loadModule(modulePath);
        }
      } catch {
        // Directory doesn't exist yet, skip
      }
    }

    console.log(`[Cortex] Discovered ${this.modules.size} module(s): ${[...this.modules.keys()].join(", ")}`);
  }

  private async loadModule(modulePath: string): Promise<void> {
    const manifestPath = path.join(modulePath, "module.json");
    try {
      const raw = await fs.readFile(manifestPath, "utf-8");
      const manifest: ModuleManifest = JSON.parse(raw);

      if (!manifest.enabled) return;

      // Load entities
      const entities: Record<string, unknown> = {};
      const entitiesDir = path.join(modulePath, "entities");
      try {
        const entityFiles = await fs.readdir(entitiesDir);
        for (const file of entityFiles) {
          if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;
          const entityModule = await import(path.join(entitiesDir, file));
          const name = file.replace(/\.(ts|js)$/, "");
          entities[name] = entityModule;
        }
      } catch {
        // No entities directory
      }

      // Load API handlers
      const apiHandlers: Record<string, ApiHandler> = {};
      const apiDir = path.join(modulePath, "api");
      try {
        const apiFiles = await fs.readdir(apiDir);
        for (const file of apiFiles) {
          if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;
          const apiModule = await import(path.join(apiDir, file));
          const resource = file.replace(/\.(ts|js)$/, "");
          if (apiModule.handlers) {
            for (const [route, handler] of Object.entries(apiModule.handlers)) {
              apiHandlers[`${resource}:${route}`] = handler as ApiHandler;
            }
          }
        }
      } catch {
        // No API directory
      }

      // Load MCP tools
      let mcpTools: McpTool[] = [];
      try {
        const mcpModule = await import(path.join(modulePath, "mcp-tools"));
        mcpTools = mcpModule.tools ?? [];
      } catch {
        // No MCP tools
      }

      // Load events
      let eventDefs: EventDefinitions = { publishes: manifest.events?.publishes ?? [], subscribers: {} };
      try {
        const eventsModule = await import(path.join(modulePath, "events"));
        if (eventsModule.events) {
          eventDefs = {
            publishes: eventsModule.events.publishes ?? manifest.events?.publishes ?? [],
            subscribers: eventsModule.events.subscribers ?? {},
          };
        }
      } catch {
        // No events file
      }

      // Load data layer mappings
      const dataLayerMappings: DataLayerMapping[] = [];
      if (manifest.dataLayer) {
        for (const [domainEvent, mapping] of Object.entries(manifest.dataLayer)) {
          dataLayerMappings.push({
            domainEvent,
            dataLayerEvent: mapping.event,
            params: mapping.params,
          });
        }
      }

      // Load AGENTS.md
      let agentsMd = "";
      try {
        agentsMd = await fs.readFile(path.join(modulePath, "AGENTS.md"), "utf-8");
      } catch {
        // No AGENTS.md
      }

      const cortexModule: CortexModule = {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        enabled: manifest.enabled,
        dependencies: manifest.dependencies ?? [],
        path: modulePath,
        entities,
        apiHandlers,
        mcpTools,
        events: eventDefs,
        dataLayerMappings,
        agentsMd,
      };

      this.modules.set(manifest.id, cortexModule);
    } catch (err) {
      console.error(`[Cortex] Failed to load module at ${modulePath}:`, err);
    }
  }

  get(id: string): CortexModule | undefined {
    return this.modules.get(id);
  }

  getAll(): CortexModule[] {
    return [...this.modules.values()];
  }

  getApiHandler(moduleId: string, resource: string, method: string, subpath: string): ApiHandler | undefined {
    const mod = this.modules.get(moduleId);
    if (!mod) return undefined;

    // Try exact match: "posts:GET /:id"
    const routeKey = `${resource}:${method} /${subpath}`;
    if (mod.apiHandlers[routeKey]) return mod.apiHandlers[routeKey];

    // Try parameterized match: "posts:GET /:id"
    for (const [key, handler] of Object.entries(mod.apiHandlers)) {
      const [res, pattern] = key.split(":");
      if (res !== resource) continue;

      const [patternMethod, patternPath] = pattern.split(" ");
      if (patternMethod !== method) continue;

      // Match /:id pattern
      const patternParts = patternPath.split("/").filter(Boolean);
      const subpathParts = subpath.split("/").filter(Boolean);

      if (patternParts.length !== subpathParts.length) continue;

      const params: Record<string, string> = {};
      let match = true;
      for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(":")) {
          params[patternParts[i].slice(1)] = subpathParts[i];
        } else if (patternParts[i] !== subpathParts[i]) {
          match = false;
          break;
        }
      }

      if (match) {
        // Return a wrapper that injects matched params
        return async (ctx) => handler({ ...ctx, params: { ...ctx.params, ...params } });
      }
    }

    return undefined;
  }

  getAllMcpTools(): McpTool[] {
    return this.getAll().flatMap((mod) => mod.mcpTools);
  }

  getAllEntities(): Record<string, unknown> {
    const all: Record<string, unknown> = {};
    for (const mod of this.getAll()) {
      for (const [name, entity] of Object.entries(mod.entities)) {
        all[`${mod.id}.${name}`] = entity;
      }
    }
    return all;
  }

  getAllDataLayerMappings(): DataLayerMapping[] {
    return this.getAll().flatMap((mod) => mod.dataLayerMappings);
  }
}

export const moduleRegistry = new ModuleRegistryImpl();
```

- [ ] **Step 2: Create src/app/api/modules/[...path]/route.ts**

```ts
import { NextRequest, NextResponse } from "next/server";
import { moduleRegistry } from "@/core/module-registry";

async function handleRequest(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: pathSegments } = await params;

  if (!pathSegments || pathSegments.length === 0) {
    return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "Missing module path" } }, { status: 400 });
  }

  const moduleId = pathSegments[0];
  const resource = pathSegments[1] || "";
  const subpath = pathSegments.slice(2).join("/");
  const method = req.method;

  const handler = moduleRegistry.getApiHandler(moduleId, resource, method, subpath);
  if (!handler) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: `No handler for ${method} /api/modules/${pathSegments.join("/")}` } },
      { status: 404 }
    );
  }

  const url = new URL(req.url);
  const searchParams: Record<string, string> = {};
  url.searchParams.forEach((value, key) => (searchParams[key] = value));

  let body: unknown = undefined;
  if (method === "POST" || method === "PUT" || method === "PATCH") {
    try {
      body = await req.json();
    } catch {
      // No body or invalid JSON
    }
  }

  try {
    const startTime = Date.now();
    const result = await handler({ params: {}, searchParams, body });
    const executionTimeMs = Date.now() - startTime;

    const statusCode = result.success ? (method === "POST" ? 201 : 200) : (result.error?.code === "NOT_FOUND" ? 404 : 400);

    return NextResponse.json(
      { ...result, metadata: { ...result.metadata, executionTimeMs } },
      { status: statusCode }
    );
  } catch (err) {
    console.error(`[Cortex] API error:`, err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
export const PATCH = handleRequest;
```

- [ ] **Step 3: Create src/app/api/health/route.ts**

```ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { moduleRegistry } from "@/core/module-registry";

export async function GET() {
  const checks: Record<string, { status: string; latency?: string }> = {};

  // Database check
  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    checks.database = { status: "ok", latency: `${Date.now() - start}ms` };
  } catch {
    checks.database = { status: "error" };
  }

  // Modules check
  const modules = moduleRegistry.getAll();
  checks.modules = { status: "ok", latency: `${modules.length} loaded` };

  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json({
    status: allOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    checks,
  });
}
```

- [ ] **Step 4: Create src/instrumentation.ts**

```ts
export async function register() {
  // Only run on server
  if (typeof window !== "undefined") return;

  const { moduleRegistry } = await import("@/core/module-registry");
  await moduleRegistry.discoverModules();

  console.log("[Cortex] Framework initialized");
}
```

- [ ] **Step 5: Verify module discovery works**

Run: `npm run dev` (let it start, then stop with Ctrl+C)
Expected: Console output includes `[Cortex] Discovered 1 module(s): blog`

- [ ] **Step 6: Test blog API**

Run: `npm run dev &` (start in background)

Run: `curl -s http://localhost:3000/api/health | head -5`
Expected: JSON with `"status": "ok"`

Run: `curl -s -X POST http://localhost:3000/api/modules/blog/posts -H 'Content-Type: application/json' -d '{"title":"Hello World","content":"First post!","author":"Cortex"}' | head -5`
Expected: JSON with `"success": true` and post data

Run: `curl -s http://localhost:3000/api/modules/blog/posts | head -5`
Expected: JSON with list containing the created post

Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add src/core/module-registry.ts src/app/api/ src/instrumentation.ts
git commit -m "feat: module registry with auto-discovery and dynamic API routing"
```

---

## Task 8: MCP Server

**Files:**
- Create: `src/core/mcp-server.ts`
- Create: `src/app/api/mcp/route.ts`
- Create: `scripts/mcp-stdio.ts`

- [ ] **Step 1: Create src/core/mcp-server.ts**

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { db } from "@/lib/db";
import { moduleRegistry } from "./module-registry";
import { sql, eq, ilike } from "drizzle-orm";
import type { ToolResponse } from "./types";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "cortex",
    version: "0.1.0",
  });

  // ─── Core Discovery Tools ───

  server.tool(
    "list_modules",
    "List all registered Cortex modules with name, version, description, and status",
    {},
    async () => {
      const modules = moduleRegistry.getAll().map((m) => ({
        id: m.id,
        name: m.name,
        version: m.version,
        description: m.description,
        enabled: m.enabled,
        entities: Object.keys(m.entities),
        apiEndpoints: Object.keys(m.apiHandlers),
        mcpTools: m.mcpTools.map((t) => t.name),
      }));
      return { content: [{ type: "text" as const, text: JSON.stringify({ success: true, data: modules }, null, 2) }] };
    }
  );

  server.tool(
    "get_module_spec",
    "Read a module's AGENTS.md content for detailed AI-readable documentation",
    { moduleId: z.string().describe("The module ID (e.g., 'blog')") },
    async ({ moduleId }) => {
      const mod = moduleRegistry.get(moduleId);
      if (!mod) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: { code: "NOT_FOUND", message: `Module '${moduleId}' not found` } }) }] };
      }
      return { content: [{ type: "text" as const, text: mod.agentsMd || `No AGENTS.md found for module '${moduleId}'` }] };
    }
  );

  server.tool(
    "discover_schema",
    "Search entity schemas by name or keyword. Returns field names, types, and descriptions.",
    { query: z.string().describe("Entity name or keyword to search for") },
    async ({ query }) => {
      const allEntities = moduleRegistry.getAllEntities();
      const results: Record<string, unknown>[] = [];
      const lowerQuery = query.toLowerCase();

      for (const [fullName, entityExports] of Object.entries(allEntities)) {
        if (fullName.toLowerCase().includes(lowerQuery)) {
          const exports = entityExports as Record<string, unknown>;
          // Extract table names and column info from Drizzle exports
          const tables: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(exports)) {
            if (value && typeof value === "object" && Symbol.for("drizzle:Name") in (value as object)) {
              tables[key] = value;
            }
          }
          results.push({ name: fullName, tables: Object.keys(tables) });
        }
      }

      return { content: [{ type: "text" as const, text: JSON.stringify({ success: true, data: results }, null, 2) }] };
    }
  );

  server.tool(
    "find_api",
    "Search API endpoints by keyword. Returns method, path, and module.",
    { query: z.string().describe("Keyword to search for in API endpoint names") },
    async ({ query }) => {
      const results: { module: string; route: string; path: string }[] = [];
      const lowerQuery = query.toLowerCase();

      for (const mod of moduleRegistry.getAll()) {
        for (const routeKey of Object.keys(mod.apiHandlers)) {
          if (routeKey.toLowerCase().includes(lowerQuery) || mod.id.toLowerCase().includes(lowerQuery)) {
            const [resource, methodPath] = routeKey.split(":");
            results.push({
              module: mod.id,
              route: routeKey,
              path: `/api/modules/${mod.id}/${resource}${methodPath.split(" ")[1]}`,
            });
          }
        }
      }

      return { content: [{ type: "text" as const, text: JSON.stringify({ success: true, data: results }, null, 2) }] };
    }
  );

  // ─── Auto-Generated Entity CRUD Tools ───

  registerEntityCrudTools(server);

  // ─── Module Custom Tools ───

  for (const mod of moduleRegistry.getAll()) {
    for (const tool of mod.mcpTools) {
      server.tool(
        tool.name,
        tool.description,
        tool.inputSchema as Record<string, z.ZodType>,
        async (input) => {
          const result = await tool.handler(input as Record<string, unknown>);
          return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
        }
      );
    }
  }

  return server;
}

function registerEntityCrudTools(server: McpServer) {
  // For each module's API handlers, create simplified CRUD MCP tools
  for (const mod of moduleRegistry.getAll()) {
    const resources = new Set<string>();
    for (const key of Object.keys(mod.apiHandlers)) {
      const resource = key.split(":")[0];
      resources.add(resource);
    }

    for (const resource of resources) {
      const singularName = resource.replace(/s$/, "");

      // create_{entity}
      server.tool(
        `create_${singularName}`,
        `Create a new ${singularName} in the ${mod.name} module`,
        { data: z.record(z.unknown()).describe(`Fields for the new ${singularName}`) },
        async ({ data }) => {
          const handler = mod.apiHandlers[`${resource}:POST /`];
          if (!handler) return { content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: { code: "NO_HANDLER", message: `No create handler for ${resource}` } }) }] };
          const result = await handler({ params: {}, searchParams: {}, body: data });
          return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
        }
      );

      // get_{entity}
      server.tool(
        `get_${singularName}`,
        `Get a ${singularName} by ID from the ${mod.name} module`,
        { id: z.string().describe(`The ${singularName} ID`) },
        async ({ id }) => {
          const handler = mod.apiHandlers[`${resource}:GET /:id`];
          if (!handler) return { content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: { code: "NO_HANDLER", message: `No get handler for ${resource}` } }) }] };
          const result = await handler({ params: { id }, searchParams: {}, body: undefined });
          return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
        }
      );

      // list_{entity}
      server.tool(
        `list_${resource}`,
        `List ${resource} from the ${mod.name} module with optional filters`,
        {
          page: z.number().optional().describe("Page number (default 1)"),
          perPage: z.number().optional().describe("Items per page (default 10)"),
          search: z.string().optional().describe("Search query"),
        },
        async ({ page, perPage, search }) => {
          const handler = mod.apiHandlers[`${resource}:GET /`];
          if (!handler) return { content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: { code: "NO_HANDLER", message: `No list handler for ${resource}` } }) }] };
          const searchParams: Record<string, string> = {};
          if (page) searchParams.page = String(page);
          if (perPage) searchParams.perPage = String(perPage);
          if (search) searchParams.search = search;
          const result = await handler({ params: {}, searchParams, body: undefined });
          return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
        }
      );

      // update_{entity}
      server.tool(
        `update_${singularName}`,
        `Update a ${singularName} by ID in the ${mod.name} module`,
        {
          id: z.string().describe(`The ${singularName} ID`),
          data: z.record(z.unknown()).describe("Fields to update"),
        },
        async ({ id, data }) => {
          const handler = mod.apiHandlers[`${resource}:PUT /:id`];
          if (!handler) return { content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: { code: "NO_HANDLER", message: `No update handler for ${resource}` } }) }] };
          const result = await handler({ params: { id }, searchParams: {}, body: data });
          return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
        }
      );

      // delete_{entity}
      server.tool(
        `delete_${singularName}`,
        `Delete a ${singularName} by ID from the ${mod.name} module`,
        { id: z.string().describe(`The ${singularName} ID`) },
        async ({ id }) => {
          const handler = mod.apiHandlers[`${resource}:DELETE /:id`];
          if (!handler) return { content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: { code: "NO_HANDLER", message: `No delete handler for ${resource}` } }) }] };
          const result = await handler({ params: { id }, searchParams: {}, body: undefined });
          return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
        }
      );
    }
  }
}
```

- [ ] **Step 2: Create src/app/api/mcp/route.ts**

```ts
import { NextRequest, NextResponse } from "next/server";
import { createMcpServer } from "@/core/mcp-server";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

export async function POST(req: NextRequest) {
  try {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    await server.connect(transport);

    const body = await req.json();
    const response = await transport.handleRequest(body);

    return NextResponse.json(response);
  } catch (err) {
    console.error("[Cortex MCP] Error:", err);
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32603, message: "Internal error" }, id: null },
      { status: 500 }
    );
  }
}
```

Note: The exact HTTP transport usage may need adjustment based on the MCP SDK version. If `StreamableHTTPServerTransport` is unavailable, we'll use a simpler request/response approach.

- [ ] **Step 3: Create scripts/mcp-stdio.ts**

```ts
#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { moduleRegistry } from "../src/core/module-registry";

async function main() {
  // Initialize module registry
  await moduleRegistry.discoverModules();

  // Dynamic import to avoid circular deps
  const { createMcpServer } = await import("../src/core/mcp-server");
  const server = createMcpServer();

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("MCP stdio server error:", err);
  process.exit(1);
});
```

- [ ] **Step 4: Commit**

```bash
git add src/core/mcp-server.ts src/app/api/mcp/ scripts/mcp-stdio.ts
git commit -m "feat: MCP server with auto-generated entity CRUD tools and discovery"
```

---

## Task 9: GTM Data Layer

**Files:**
- Create: `src/core/data-layer.ts`
- Create: `src/components/DataLayerProvider.tsx`
- Create: `src/components/GTMScript.tsx`

- [ ] **Step 1: Create src/core/data-layer.ts**

```ts
import { eventBus } from "./event-bus";
import { moduleRegistry } from "./module-registry";
import type { DomainEvent, DataLayerPush } from "./types";

class DataLayerService {
  private pendingPushes: DataLayerPush[] = [];

  init(): void {
    eventBus.subscribeAll(async (event: DomainEvent) => {
      const push = this.mapEventToDataLayer(event);
      if (push) {
        this.pendingPushes.push(push);
      }
    });
  }

  private mapEventToDataLayer(event: DomainEvent): DataLayerPush | null {
    const mappings = moduleRegistry.getAllDataLayerMappings();
    const mapping = mappings.find((m) => m.domainEvent === event.type);

    if (!mapping) return null;

    const push: DataLayerPush = { event: mapping.dataLayerEvent };
    for (const param of mapping.params) {
      if (event.payload[param] !== undefined) {
        push[param] = event.payload[param];
      }
    }
    push.cortex_module = event.module;
    push.cortex_event_id = event.id;
    push.cortex_timestamp = event.metadata.timestamp.toISOString();

    return push;
  }

  flush(): DataLayerPush[] {
    const pushes = [...this.pendingPushes];
    this.pendingPushes = [];
    return pushes;
  }
}

export const dataLayerService = new DataLayerService();
```

- [ ] **Step 2: Create src/components/DataLayerProvider.tsx**

```tsx
"use client";

import { createContext, useContext, useEffect, useCallback, type ReactNode } from "react";

interface DataLayerContextType {
  pushEvent: (event: Record<string, unknown>) => void;
}

const DataLayerContext = createContext<DataLayerContextType>({ pushEvent: () => {} });

export function useDataLayer() {
  return useContext(DataLayerContext);
}

interface DataLayerProviderProps {
  children: ReactNode;
  initialEvents?: Record<string, unknown>[];
}

export function DataLayerProvider({ children, initialEvents }: DataLayerProviderProps) {
  useEffect(() => {
    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];

    // Push any server-side events
    if (initialEvents) {
      for (const event of initialEvents) {
        window.dataLayer.push(event);
      }
    }
  }, [initialEvents]);

  const pushEvent = useCallback((event: Record<string, unknown>) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(event);
  }, []);

  return (
    <DataLayerContext.Provider value={{ pushEvent }}>
      {children}
    </DataLayerContext.Provider>
  );
}

// Extend Window type
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}
```

- [ ] **Step 3: Create src/components/GTMScript.tsx**

```tsx
"use client";

import Script from "next/script";

export function GTMScript({ gtmId }: { gtmId?: string }) {
  if (!gtmId) return null;

  return (
    <>
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `,
        }}
      />
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/core/data-layer.ts src/components/
git commit -m "feat: GTM data layer with event bus bridge and DataLayerProvider"
```

---

## Task 10: Theme System Core

**Files:**
- Create: `src/core/theme-registry.ts`
- Create: `src/components/ThemeProvider.tsx`
- Create: `themes/default/theme.json`
- Create: `themes/default/styles/theme.css`

- [ ] **Step 1: Create src/core/theme-registry.ts**

```ts
import fs from "fs/promises";
import path from "path";
import type { ThemeConfig, Theme } from "./theme-types";

class ThemeRegistryImpl {
  private themes = new Map<string, Theme>();
  private activeThemeId: string = "cortex-default";

  async discoverThemes(): Promise<void> {
    const themesDir = path.join(process.cwd(), "themes");
    try {
      const entries = await fs.readdir(themesDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const themePath = path.join(themesDir, entry.name);
        await this.loadTheme(themePath);
      }
    } catch {
      // No themes directory
    }
    console.log(`[Cortex] Discovered ${this.themes.size} theme(s): ${[...this.themes.keys()].join(", ")}`);
  }

  private async loadTheme(themePath: string): Promise<void> {
    try {
      const configPath = path.join(themePath, "theme.json");
      const raw = await fs.readFile(configPath, "utf-8");
      const config: ThemeConfig = JSON.parse(raw);

      this.themes.set(config.id, {
        config,
        path: themePath,
        active: config.id === this.activeThemeId,
      });
    } catch (err) {
      console.error(`[Cortex] Failed to load theme at ${themePath}:`, err);
    }
  }

  getActive(): Theme | undefined {
    return this.themes.get(this.activeThemeId) ?? this.themes.values().next().value;
  }

  get(id: string): Theme | undefined {
    return this.themes.get(id);
  }

  getAll(): Theme[] {
    return [...this.themes.values()];
  }

  async activate(themeId: string): Promise<boolean> {
    const theme = this.themes.get(themeId);
    if (!theme) return false;

    // Deactivate current
    for (const t of this.themes.values()) {
      t.active = false;
    }

    theme.active = true;
    this.activeThemeId = themeId;
    return true;
  }

  getTokensAsCSS(theme?: Theme): string {
    const t = theme ?? this.getActive();
    if (!t) return "";

    const { tokens } = t.config;
    const vars: string[] = [];

    // Colors
    for (const [name, value] of Object.entries(tokens.colors)) {
      vars.push(`--color-${name}: ${value};`);
    }

    // Typography
    for (const [name, value] of Object.entries(tokens.typography.fontFamily)) {
      vars.push(`--font-${name}: ${value};`);
    }
    for (const [name, value] of Object.entries(tokens.typography.fontSize)) {
      vars.push(`--text-${name}: ${value};`);
    }

    // Spacing
    for (const [name, value] of Object.entries(tokens.spacing)) {
      vars.push(`--spacing-${name}: ${value};`);
    }

    // Border radius
    for (const [name, value] of Object.entries(tokens.borderRadius)) {
      vars.push(`--radius-${name}: ${value};`);
    }

    // Shadows
    for (const [name, value] of Object.entries(tokens.shadows)) {
      vars.push(`--shadow-${name}: ${value};`);
    }

    return `:root {\n  ${vars.join("\n  ")}\n}`;
  }
}

export const themeRegistry = new ThemeRegistryImpl();
```

- [ ] **Step 2: Create src/components/ThemeProvider.tsx**

```tsx
import { themeRegistry } from "@/core/theme-registry";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const css = themeRegistry.getTokensAsCSS();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </>
  );
}
```

- [ ] **Step 3: Create themes/default/theme.json**

```json
{
  "id": "cortex-default",
  "name": "Cortex Default",
  "version": "1.0.0",
  "description": "Professional default theme for Cortex",
  "author": "Cortex Team",
  "tokens": {
    "colors": {
      "primary": "#0066FF",
      "secondary": "#6366F1",
      "accent": "#F59E0B",
      "background": "#FFFFFF",
      "text": "#111827",
      "muted": "#6B7280"
    },
    "typography": {
      "fontFamily": {
        "sans": "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        "mono": "'JetBrains Mono', 'Fira Code', monospace"
      },
      "fontSize": {
        "xs": "0.75rem",
        "sm": "0.875rem",
        "base": "1rem",
        "lg": "1.125rem",
        "xl": "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
        "4xl": "2.25rem",
        "5xl": "3rem",
        "6xl": "3.75rem"
      }
    },
    "spacing": {
      "xs": "0.5rem",
      "sm": "1rem",
      "md": "1.5rem",
      "lg": "2rem",
      "xl": "3rem",
      "2xl": "4rem",
      "3xl": "6rem"
    },
    "borderRadius": {
      "none": "0",
      "sm": "0.25rem",
      "md": "0.5rem",
      "lg": "0.75rem",
      "xl": "1rem",
      "full": "9999px"
    },
    "shadows": {
      "sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      "md": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      "lg": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      "xl": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
    }
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

- [ ] **Step 4: Create themes/default/styles/theme.css**

```css
/* Cortex Default Theme - CSS Custom Properties & Utilities */

/* Smooth transitions for interactive elements */
.transition-default {
  transition: all 0.2s ease-in-out;
}

/* Focus ring for accessibility */
.focus-ring {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Gradient utilities */
.gradient-primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
}

/* Animation keyframes */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.6s ease-out;
}
```

- [ ] **Step 5: Update src/instrumentation.ts to also discover themes**

Replace `src/instrumentation.ts`:

```ts
export async function register() {
  if (typeof window !== "undefined") return;

  const { moduleRegistry } = await import("@/core/module-registry");
  const { themeRegistry } = await import("@/core/theme-registry");
  const { dataLayerService } = await import("@/core/data-layer");

  await moduleRegistry.discoverModules();
  await themeRegistry.discoverThemes();
  dataLayerService.init();

  console.log("[Cortex] Framework initialized");
}
```

- [ ] **Step 6: Commit**

```bash
git add src/core/theme-registry.ts src/components/ThemeProvider.tsx themes/default/theme.json themes/default/styles/theme.css src/instrumentation.ts
git commit -m "feat: theme registry with CSS variable injection and default theme tokens"
```

---

## Task 11: Default Theme Components

**Files:**
- Create: `themes/default/components/Container.tsx`
- Create: `themes/default/components/Button.tsx`
- Create: `themes/default/components/Card.tsx`
- Create: `themes/default/components/Header.tsx`
- Create: `themes/default/components/Footer.tsx`
- Create: `themes/default/components/Hero.tsx`
- Create: `themes/default/components/Section.tsx`

- [ ] **Step 1: Create themes/default/components/Container.tsx**

```tsx
import type { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizeMap = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-full",
};

export function Container({ children, className = "", size = "xl" }: ContainerProps) {
  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${sizeMap[size]} ${className}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create themes/default/components/Button.tsx**

```tsx
import type { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
}

const variantStyles = {
  primary:
    "bg-[var(--color-primary)] text-white hover:opacity-90 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]",
  secondary:
    "bg-[var(--color-secondary)] text-white hover:opacity-90",
  outline:
    "border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white",
  ghost:
    "text-[var(--color-text)] hover:bg-gray-100",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm rounded-[var(--radius-md)]",
  md: "px-5 py-2.5 text-base rounded-[var(--radius-md)]",
  lg: "px-8 py-3.5 text-lg rounded-[var(--radius-lg)]",
};

export function Button({ children, variant = "primary", size = "md", href, className = "", ...props }: ButtonProps) {
  const styles = `inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  if (href) {
    return (
      <a href={href} className={styles}>
        {children}
      </a>
    );
  }

  return (
    <button className={styles} {...props}>
      {children}
    </button>
  );
}
```

- [ ] **Step 3: Create themes/default/components/Card.tsx**

```tsx
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
}

const paddingMap = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({ children, className = "", hover = true, padding = "md" }: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] border border-gray-100
        ${hover ? "hover:shadow-[var(--shadow-md)] transition-shadow duration-200" : ""}
        ${paddingMap[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Create themes/default/components/Header.tsx**

```tsx
"use client";

import { useState } from "react";
import { Container } from "./Container";
import { Button } from "./Button";

interface NavItem {
  label: string;
  href: string;
}

interface HeaderProps {
  logo?: string;
  navigation?: NavItem[];
  cta?: { label: string; href: string };
  style?: "fixed" | "static" | "transparent";
}

export function Header({
  logo = "Cortex",
  navigation = [],
  cta,
  style = "fixed",
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const positionClass = style === "fixed" ? "fixed top-0 left-0 right-0 z-50" : "relative";
  const bgClass = style === "transparent" ? "bg-transparent" : "bg-white/95 backdrop-blur-sm border-b border-gray-100";

  return (
    <header className={`${positionClass} ${bgClass}`}>
      <Container>
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <a href="/" className="text-xl font-bold text-[var(--color-text)] tracking-tight">
            {logo}
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-[var(--color-muted)] hover:text-[var(--color-text)] font-medium transition-colors duration-200"
              >
                {item.label}
              </a>
            ))}
            {cta && (
              <Button href={cta.href} size="sm">
                {cta.label}
              </Button>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-[var(--color-muted)]"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <nav className="md:hidden py-4 border-t border-gray-100">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block py-2 text-[var(--color-muted)] hover:text-[var(--color-text)] font-medium"
              >
                {item.label}
              </a>
            ))}
            {cta && (
              <div className="pt-4">
                <Button href={cta.href} size="sm" className="w-full">
                  {cta.label}
                </Button>
              </div>
            )}
          </nav>
        )}
      </Container>
    </header>
  );
}
```

- [ ] **Step 5: Create themes/default/components/Hero.tsx**

```tsx
import { Container } from "./Container";
import { Button } from "./Button";

interface HeroProps {
  title: string;
  subtitle?: string;
  cta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  layout?: "center" | "split" | "full";
  className?: string;
}

export function Hero({
  title,
  subtitle,
  cta,
  secondaryCta,
  layout = "center",
  className = "",
}: HeroProps) {
  if (layout === "center") {
    return (
      <section className={`relative py-24 sm:py-32 lg:py-40 ${className}`}>
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <Container size="lg">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--color-text)] tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-6 text-lg sm:text-xl text-[var(--color-muted)] max-w-2xl mx-auto leading-relaxed">
                {subtitle}
              </p>
            )}
            {(cta || secondaryCta) && (
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                {cta && <Button size="lg" href={cta.href}>{cta.label}</Button>}
                {secondaryCta && (
                  <Button size="lg" variant="outline" href={secondaryCta.href}>
                    {secondaryCta.label}
                  </Button>
                )}
              </div>
            )}
          </div>
        </Container>
      </section>
    );
  }

  // Split layout
  return (
    <section className={`relative py-24 sm:py-32 ${className}`}>
      <Container>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--color-text)] tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-6 text-lg text-[var(--color-muted)] leading-relaxed">
                {subtitle}
              </p>
            )}
            {(cta || secondaryCta) && (
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                {cta && <Button size="lg" href={cta.href}>{cta.label}</Button>}
                {secondaryCta && (
                  <Button size="lg" variant="outline" href={secondaryCta.href}>
                    {secondaryCta.label}
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="bg-gray-100 rounded-[var(--radius-xl)] aspect-video flex items-center justify-center text-[var(--color-muted)]">
            <svg className="w-16 h-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 6: Create themes/default/components/Section.tsx**

```tsx
import type { ReactNode } from "react";
import { Container } from "./Container";

interface SectionProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  background?: "default" | "muted" | "accent" | "dark";
  padding?: "sm" | "md" | "lg";
  className?: string;
}

const bgMap = {
  default: "bg-white",
  muted: "bg-gray-50",
  accent: "bg-[var(--color-primary)]/5",
  dark: "bg-gray-900 text-white",
};

const paddingMap = {
  sm: "py-12 sm:py-16",
  md: "py-16 sm:py-24",
  lg: "py-24 sm:py-32",
};

export function Section({
  title,
  subtitle,
  children,
  background = "default",
  padding = "md",
  className = "",
}: SectionProps) {
  return (
    <section className={`${bgMap[background]} ${paddingMap[padding]} ${className}`}>
      <Container>
        {(title || subtitle) && (
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            {title && (
              <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${background === "dark" ? "text-white" : "text-[var(--color-text)]"}`}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className={`mt-4 text-lg ${background === "dark" ? "text-gray-300" : "text-[var(--color-muted)]"}`}>
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </Container>
    </section>
  );
}
```

- [ ] **Step 7: Create themes/default/components/Footer.tsx**

```tsx
import { Container } from "./Container";

interface FooterColumn {
  title: string;
  links: Array<{ label: string; href: string }>;
}

interface SocialLink {
  platform: string;
  url: string;
}

interface FooterProps {
  columns?: FooterColumn[];
  social?: SocialLink[];
  copyright?: string;
  logo?: string;
}

export function Footer({
  columns = [],
  social = [],
  copyright = `\u00A9 ${new Date().getFullYear()} Cortex. All rights reserved.`,
  logo = "Cortex",
}: FooterProps) {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <Container>
        <div className="py-12 sm:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <span className="text-xl font-bold text-white">{logo}</span>
              <p className="mt-4 text-sm text-gray-400 leading-relaxed">
                AI-first web framework for building modern applications.
              </p>
              {social.length > 0 && (
                <div className="mt-6 flex gap-4">
                  {social.map((s) => (
                    <a
                      key={s.platform}
                      href={s.url}
                      className="text-gray-400 hover:text-white transition-colors"
                      aria-label={s.platform}
                    >
                      {s.platform}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Link columns */}
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-gray-800 text-sm text-gray-500">
          {copyright}
        </div>
      </Container>
    </footer>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add themes/default/components/
git commit -m "feat: default theme components (Button, Card, Header, Hero, Section, Footer, Container)"
```

---

## Task 12: Default Theme Layouts

**Files:**
- Create: `themes/default/layouts/BaseLayout.tsx`
- Create: `themes/default/layouts/LandingLayout.tsx`
- Create: `themes/default/layouts/BlogLayout.tsx`

- [ ] **Step 1: Create themes/default/layouts/BaseLayout.tsx**

```tsx
import type { ReactNode } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

interface BaseLayoutProps {
  children: ReactNode;
}

const defaultNav = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
  { label: "Admin", href: "/admin" },
];

const defaultFooterColumns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Modules", href: "#modules" },
      { label: "Themes", href: "#themes" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "API Reference", href: "/api" },
      { label: "AGENTS.md", href: "/agents" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export function BaseLayout({ children }: BaseLayoutProps) {
  return (
    <>
      <Header
        navigation={defaultNav}
        cta={{ label: "Get Started", href: "#" }}
      />
      <main className="pt-20">{children}</main>
      <Footer columns={defaultFooterColumns} />
    </>
  );
}
```

- [ ] **Step 2: Create themes/default/layouts/LandingLayout.tsx**

```tsx
import type { ReactNode } from "react";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { Footer } from "../components/Footer";

interface LandingLayoutProps {
  children: ReactNode;
  hero?: {
    title: string;
    subtitle?: string;
    cta?: { label: string; href: string };
    secondaryCta?: { label: string; href: string };
    layout?: "center" | "split";
  };
}

const defaultNav = [
  { label: "Features", href: "#features" },
  { label: "Blog", href: "/blog" },
  { label: "Admin", href: "/admin" },
];

const defaultFooterColumns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Modules", href: "#modules" },
      { label: "Themes", href: "#themes" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "API Reference", href: "/api" },
      { label: "GitHub", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export function LandingLayout({ children, hero }: LandingLayoutProps) {
  return (
    <>
      <Header
        navigation={defaultNav}
        cta={{ label: "Get Started", href: "#" }}
      />
      <main className="pt-20">
        {hero && (
          <Hero
            title={hero.title}
            subtitle={hero.subtitle}
            cta={hero.cta}
            secondaryCta={hero.secondaryCta}
            layout={hero.layout}
          />
        )}
        {children}
      </main>
      <Footer columns={defaultFooterColumns} />
    </>
  );
}
```

- [ ] **Step 3: Create themes/default/layouts/BlogLayout.tsx**

```tsx
import type { ReactNode } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Container } from "../components/Container";

interface BlogLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
}

const defaultNav = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
  { label: "Admin", href: "/admin" },
];

export function BlogLayout({ children, sidebar }: BlogLayoutProps) {
  return (
    <>
      <Header navigation={defaultNav} cta={{ label: "Get Started", href: "#" }} />
      <main className="pt-20">
        <Container>
          <div className="py-12 sm:py-16">
            <div className={sidebar ? "grid lg:grid-cols-[1fr_300px] gap-12" : ""}>
              <div>{children}</div>
              {sidebar && (
                <aside className="hidden lg:block">
                  <div className="sticky top-24">{sidebar}</div>
                </aside>
              )}
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add themes/default/layouts/
git commit -m "feat: default theme layouts (Base, Landing, Blog)"
```

---

## Task 13: Root Layout + Frontend Pages

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/blog/page.tsx`
- Create: `src/app/blog/[slug]/page.tsx`
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `modules/blog/components/PostCard.tsx`

- [ ] **Step 1: Create src/app/layout.tsx**

```tsx
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DataLayerProvider } from "@/components/DataLayerProvider";
import { GTMScript } from "@/components/GTMScript";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cortex — AI-First Web Framework",
  description: "Build AI-powered web applications with module auto-discovery, MCP integration, and GTM data layer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-[var(--font-sans)] text-[var(--color-text)] bg-[var(--color-background)] antialiased">
        <ThemeProvider>
          <DataLayerProvider>
            <GTMScript gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
            {children}
          </DataLayerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create src/app/page.tsx**

```tsx
import { LandingLayout } from "@themes/default/layouts/LandingLayout";
import { Section } from "@themes/default/components/Section";
import { Card } from "@themes/default/components/Card";

export default function HomePage() {
  return (
    <LandingLayout
      hero={{
        title: "The AI-First Web Framework",
        subtitle:
          "Build sophisticated web applications where AI agents are first-class citizens. Module auto-discovery, MCP integration, and GTM tracking built in.",
        cta: { label: "Quick Start", href: "#features" },
        secondaryCta: { label: "View on GitHub", href: "#" },
        layout: "center",
      }}
    >
      <Section
        title="Built for the AI Era"
        subtitle="Everything an AI agent needs to understand and extend your application."
        background="muted"
        id="features"
      >
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <div className="text-3xl mb-4">&#x1F50D;</div>
            <h3 className="text-lg font-semibold text-[var(--color-text)]">Module Auto-Discovery</h3>
            <p className="mt-2 text-[var(--color-muted)]">
              Drop a folder in /modules — routes, entities, and MCP tools register automatically. Zero config.
            </p>
          </Card>
          <Card>
            <div className="text-3xl mb-4">&#x1F916;</div>
            <h3 className="text-lg font-semibold text-[var(--color-text)]">MCP Integration</h3>
            <p className="mt-2 text-[var(--color-muted)]">
              Every entity gets CRUD tools for AI agents. Claude, Cursor, and any MCP client can manage your app.
            </p>
          </Card>
          <Card>
            <div className="text-3xl mb-4">&#x1F4CA;</div>
            <h3 className="text-lg font-semibold text-[var(--color-text)]">GTM Data Layer</h3>
            <p className="mt-2 text-[var(--color-muted)]">
              Domain events automatically push to window.dataLayer. Set up conversions and audiences from day one.
            </p>
          </Card>
        </div>
      </Section>

      <Section title="How It Works">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mx-auto text-xl font-bold">1</div>
            <h3 className="mt-4 font-semibold text-[var(--color-text)]">Describe Your Site</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">Write a plain-text layout description in .cortex/my-site.md</p>
          </div>
          <div>
            <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mx-auto text-xl font-bold">2</div>
            <h3 className="mt-4 font-semibold text-[var(--color-text)]">Generate Theme</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">Run npm run theme:generate and AI creates your professional theme</p>
          </div>
          <div>
            <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mx-auto text-xl font-bold">3</div>
            <h3 className="mt-4 font-semibold text-[var(--color-text)]">Launch</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">npm run dev — your AI-powered website is live in minutes</p>
          </div>
        </div>
      </Section>
    </LandingLayout>
  );
}
```

- [ ] **Step 3: Create modules/blog/components/PostCard.tsx**

```tsx
import { Card } from "@themes/default/components/Card";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    author: string;
    tags: string[];
    publishedAt?: string | null;
    createdAt: string;
  };
}

export function PostCard({ post }: PostCardProps) {
  const date = post.publishedAt || post.createdAt;
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <a href={`/blog/${post.slug}`} className="block group">
      <Card hover>
        <div className="flex flex-wrap gap-2 mb-3">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
            >
              {tag}
            </span>
          ))}
        </div>
        <h2 className="text-xl font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="mt-2 text-[var(--color-muted)] line-clamp-2">{post.excerpt}</p>
        )}
        <div className="mt-4 flex items-center gap-3 text-sm text-[var(--color-muted)]">
          <span>{post.author}</span>
          <span>&middot;</span>
          <span>{formattedDate}</span>
        </div>
      </Card>
    </a>
  );
}
```

- [ ] **Step 4: Create src/app/blog/page.tsx**

```tsx
import { db } from "@/lib/db";
import { posts } from "@modules/blog/entities/post";
import { desc, eq } from "drizzle-orm";
import { BlogLayout } from "@themes/default/layouts/BlogLayout";
import { PostCard } from "@modules/blog/components/PostCard";

export default async function BlogPage() {
  const allPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt));

  return (
    <BlogLayout>
      <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text)] mb-8">Blog</h1>
      {allPosts.length === 0 ? (
        <p className="text-[var(--color-muted)]">No posts yet. Create one via the API or MCP tools.</p>
      ) : (
        <div className="space-y-6">
          {allPosts.map((post) => (
            <PostCard
              key={post.id}
              post={{
                ...post,
                publishedAt: post.publishedAt?.toISOString() ?? null,
                createdAt: post.createdAt.toISOString(),
              }}
            />
          ))}
        </div>
      )}
    </BlogLayout>
  );
}
```

- [ ] **Step 5: Create src/app/blog/[slug]/page.tsx**

```tsx
import { db } from "@/lib/db";
import { posts } from "@modules/blog/entities/post";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BlogLayout } from "@themes/default/layouts/BlogLayout";
import { Container } from "@themes/default/components/Container";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const [post] = await db.select().from(posts).where(eq(posts.slug, slug));

  if (!post) notFound();

  const formattedDate = (post.publishedAt ?? post.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <BlogLayout>
      <article className="max-w-3xl">
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text)] leading-tight">
          {post.title}
        </h1>
        <div className="mt-4 flex items-center gap-3 text-sm text-[var(--color-muted)]">
          <span>{post.author}</span>
          <span>&middot;</span>
          <span>{formattedDate}</span>
        </div>
        <div className="mt-8 prose prose-lg max-w-none text-[var(--color-text)]">
          {post.content.split("\n").map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </article>
    </BlogLayout>
  );
}
```

- [ ] **Step 6: Create src/app/admin/layout.tsx**

```tsx
import { BaseLayout } from "@themes/default/layouts/BaseLayout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <BaseLayout>{children}</BaseLayout>;
}
```

- [ ] **Step 7: Create src/app/admin/page.tsx**

```tsx
import { db } from "@/lib/db";
import { events as eventsTable } from "@/lib/schema";
import { posts } from "@modules/blog/entities/post";
import { desc, sql } from "drizzle-orm";
import { moduleRegistry } from "@/core/module-registry";
import { themeRegistry } from "@/core/theme-registry";
import { Container } from "@themes/default/components/Container";
import { Card } from "@themes/default/components/Card";

export default async function AdminPage() {
  const modules = moduleRegistry.getAll();
  const themes = themeRegistry.getAll();

  const [postCount] = await db.select({ count: sql<number>`count(*)` }).from(posts);
  const recentEvents = await db.select().from(eventsTable).orderBy(desc(eventsTable.createdAt)).limit(10);

  return (
    <Container>
      <div className="py-12">
        <h1 className="text-3xl font-bold text-[var(--color-text)] mb-8">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <p className="text-sm text-[var(--color-muted)]">Modules</p>
            <p className="text-3xl font-bold text-[var(--color-text)]">{modules.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--color-muted)]">Themes</p>
            <p className="text-3xl font-bold text-[var(--color-text)]">{themes.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--color-muted)]">Blog Posts</p>
            <p className="text-3xl font-bold text-[var(--color-text)]">{Number(postCount.count)}</p>
          </Card>
        </div>

        {/* Modules */}
        <h2 className="text-xl font-semibold mb-4">Registered Modules</h2>
        <div className="space-y-3 mb-12">
          {modules.map((mod) => (
            <Card key={mod.id} padding="sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold">{mod.name}</span>
                  <span className="text-[var(--color-muted)] ml-2">v{mod.version}</span>
                </div>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">active</span>
              </div>
              <p className="text-sm text-[var(--color-muted)] mt-1">{mod.description}</p>
            </Card>
          ))}
        </div>

        {/* Recent Events */}
        <h2 className="text-xl font-semibold mb-4">Recent Events</h2>
        {recentEvents.length === 0 ? (
          <p className="text-[var(--color-muted)]">No events yet.</p>
        ) : (
          <div className="space-y-2">
            {recentEvents.map((evt) => (
              <Card key={evt.id} padding="sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">{evt.type}</span>
                  <span className="text-xs text-[var(--color-muted)]">
                    {new Date(evt.createdAt).toLocaleString()}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
```

- [ ] **Step 8: Verify the app starts and renders**

Run: `npm run dev`
Visit: `http://localhost:3000` — should see the landing page
Visit: `http://localhost:3000/blog` — should see blog page (empty)
Visit: `http://localhost:3000/admin` — should see admin dashboard

- [ ] **Step 9: Commit**

```bash
git add src/app/ modules/blog/components/
git commit -m "feat: frontend pages (landing, blog, admin) with default theme layouts"
```

---

## Task 14: Blog Module Extras (Events, MCP Tools, AGENTS.md)

**Files:**
- Create: `modules/blog/events.ts`
- Create: `modules/blog/mcp-tools.ts`
- Create: `modules/blog/AGENTS.md`

- [ ] **Step 1: Create modules/blog/events.ts**

```ts
import type { DomainEvent } from "@/core/types";

export const events = {
  publishes: [
    "post.created",
    "post.published",
    "post.updated",
    "post.deleted",
    "comment.created",
    "comment.approved",
  ],
  subscribers: {} as Record<string, (event: DomainEvent) => Promise<void>>,
};
```

- [ ] **Step 2: Create modules/blog/mcp-tools.ts**

```ts
import { z } from "zod";
import { db } from "@/lib/db";
import { posts } from "./entities/post";
import { eq, ilike, or, desc } from "drizzle-orm";
import { eventBus } from "@/core/event-bus";
import type { McpTool, ToolResponse } from "@/core/types";

export const tools: McpTool[] = [
  {
    name: "publish_post",
    description: "Publish a draft post, optionally at a scheduled time",
    inputSchema: {
      postId: z.string().describe("The post ID to publish"),
      publishAt: z.string().optional().describe("ISO date string for scheduled publishing"),
    },
    handler: async (input): Promise<ToolResponse> => {
      const { postId } = input as { postId: string; publishAt?: string };
      const [post] = await db
        .update(posts)
        .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
        .where(eq(posts.id, postId))
        .returning();

      if (!post) return { success: false, error: { code: "NOT_FOUND", message: `Post ${postId} not found` } };

      await eventBus.publish({
        type: "post.published",
        module: "blog",
        payload: { post_id: post.id, post_title: post.title, author: post.author, tags: post.tags },
      });

      return { success: true, data: post };
    },
  },
  {
    name: "search_posts",
    description: "Full-text search across post titles and content",
    inputSchema: {
      query: z.string().describe("Search query"),
      limit: z.number().optional().describe("Max results (default 10)"),
    },
    handler: async (input): Promise<ToolResponse> => {
      const { query, limit = 10 } = input as { query: string; limit?: number };
      const results = await db
        .select()
        .from(posts)
        .where(or(ilike(posts.title, `%${query}%`), ilike(posts.content, `%${query}%`)))
        .orderBy(desc(posts.createdAt))
        .limit(limit);

      return { success: true, data: results, metadata: { total: results.length } };
    },
  },
];
```

- [ ] **Step 3: Create modules/blog/AGENTS.md**

```markdown
# AGENTS.md - Blog Module

## Overview
The blog module provides content publishing capabilities with posts and comments. It is auto-discovered by Cortex and exposes REST APIs and MCP tools.

## Entities

### Post
- **Table:** `blog_posts`
- **Fields:** id (uuid), title, slug (unique, auto-generated), content (markdown), excerpt, status (draft/published/archived), author, tags (jsonb array), metadata (jsonb), publishedAt, createdAt, updatedAt
- **Relationships:** hasMany(Comment)

### Comment
- **Table:** `blog_comments`
- **Fields:** id (uuid), postId (FK to Post), parentId (self-referential for threading), authorName, authorEmail, content, status (pending/approved/spam), createdAt

## APIs
- `GET /api/modules/blog/posts` — List posts (filters: status, tag, search, page, perPage)
- `POST /api/modules/blog/posts` — Create post (requires: title)
- `GET /api/modules/blog/posts/:id` — Get single post
- `PUT /api/modules/blog/posts/:id` — Update post
- `DELETE /api/modules/blog/posts/:id` — Delete post
- `POST /api/modules/blog/posts/:id/publish` — Publish a draft

- `GET /api/modules/blog/comments` — List comments (filter: postId)
- `POST /api/modules/blog/comments` — Create comment (requires: postId, authorName, authorEmail, content)
- `GET /api/modules/blog/comments/:id` — Get comment
- `PUT /api/modules/blog/comments/:id` — Update comment (content, status)
- `DELETE /api/modules/blog/comments/:id` — Delete comment

## Events Published
- `post.created` — When a new post is created
- `post.published` — When a post status changes to published
- `post.updated` — When a post is edited
- `post.deleted` — When a post is deleted
- `comment.created` — When a new comment is added
- `comment.approved` — When a comment status changes to approved

## MCP Tools
- `create_post(data)` — Create a new blog post
- `get_post(id)` — Get a post by ID
- `list_posts(page?, perPage?, search?)` — List posts with filters
- `update_post(id, data)` — Update a post
- `delete_post(id)` — Delete a post
- `create_comment(data)` — Create a comment
- `get_comment(id)` — Get a comment
- `list_comments(postId?)` — List comments
- `update_comment(id, data)` — Update a comment
- `delete_comment(id)` — Delete a comment
- `publish_post(postId)` — Publish a draft post
- `search_posts(query, limit?)` — Full-text search across posts

## GTM Data Layer Events
- `post.created` → pushes `content_created` with post_id, post_title, author
- `post.published` → pushes `content_published` with post_id, post_title, author, tags
- `comment.created` → pushes `comment_submitted` with post_id, comment_length

## Common AI Tasks
1. **Create a blog post:** Use `create_post` MCP tool with title and content
2. **Publish a draft:** Use `publish_post` with the post ID
3. **Search for content:** Use `search_posts` with a keyword query
4. **Moderate comments:** Use `update_comment` to set status to "approved" or "spam"
```

- [ ] **Step 4: Commit**

```bash
git add modules/blog/events.ts modules/blog/mcp-tools.ts modules/blog/AGENTS.md
git commit -m "feat: blog module events, custom MCP tools, and AGENTS.md"
```

---

## Task 15: AI Theme Generator + CLI

**Files:**
- Create: `scripts/generate-theme.ts`

- [ ] **Step 1: Create scripts/generate-theme.ts**

```ts
#!/usr/bin/env node

import { Command } from "commander";
import fs from "fs/promises";
import path from "path";

const THEMES_DIR = path.join(process.cwd(), "themes");

const program = new Command();
program.name("cortex-theme").description("Cortex theme generator").version("1.0.0");

program
  .command("generate")
  .description("Generate theme from layout description")
  .option("-f, --file <path>", "Path to layout instructions file")
  .option("-d, --description <text>", "Inline layout description")
  .option("-n, --name <name>", "Theme name", "custom")
  .option("-b, --base <theme>", "Base theme to extend", "default")
  .action(async (options) => {
    let description: string;

    if (options.file) {
      description = await fs.readFile(options.file, "utf-8");
    } else if (options.description) {
      description = options.description;
    } else {
      console.error("Error: Must provide --file or --description");
      process.exit(1);
    }

    console.log("Generating theme...\n");

    const basePath = path.join(THEMES_DIR, options.base);
    const newPath = path.join(THEMES_DIR, options.name);

    // Check base theme exists
    try {
      await fs.access(basePath);
    } catch {
      console.error(`Base theme '${options.base}' not found at ${basePath}`);
      process.exit(1);
    }

    // Copy base theme
    await copyDir(basePath, newPath);

    // Try AI customization
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      console.log("Using AI to customize theme based on description...\n");
      try {
        const instructions = await parseLayoutInstructions(description, apiKey);
        await customizeTheme(newPath, instructions);
        console.log("AI customization applied.\n");
      } catch (err) {
        console.error("AI customization failed, using base theme as-is:", err);
      }
    } else {
      console.log("No ANTHROPIC_API_KEY set. Copying base theme without AI customization.\n");
      console.log("Set ANTHROPIC_API_KEY in .env.local for AI-powered theme generation.\n");
    }

    // Update theme ID and name
    const themeJsonPath = path.join(newPath, "theme.json");
    const themeJson = JSON.parse(await fs.readFile(themeJsonPath, "utf-8"));
    themeJson.id = options.name;
    themeJson.name = options.name.charAt(0).toUpperCase() + options.name.slice(1);
    await fs.writeFile(themeJsonPath, JSON.stringify(themeJson, null, 2));

    console.log(`Theme generated successfully!`);
    console.log(`Location: ${newPath}\n`);
    console.log("Next steps:");
    console.log(`  1. npm run theme:activate ${options.name}`);
    console.log("  2. npm run dev");
  });

program
  .command("activate <name>")
  .description("Activate a theme")
  .action(async (name) => {
    const themePath = path.join(THEMES_DIR, name);
    const themeJsonPath = path.join(themePath, "theme.json");

    try {
      await fs.access(themeJsonPath);
    } catch {
      console.error(`Theme '${name}' not found at ${themePath}`);
      process.exit(1);
    }

    // Write active theme config
    const configPath = path.join(process.cwd(), ".cortex", "config.json");
    await fs.mkdir(path.dirname(configPath), { recursive: true });

    let config: Record<string, unknown> = {};
    try {
      config = JSON.parse(await fs.readFile(configPath, "utf-8"));
    } catch {
      // New config
    }

    config.activeTheme = name;
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    console.log(`Theme '${name}' activated.`);
    console.log("Restart dev server to apply: npm run dev");
  });

program
  .command("list")
  .description("List available themes")
  .action(async () => {
    try {
      const entries = await fs.readdir(THEMES_DIR, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        try {
          const themeJson = JSON.parse(
            await fs.readFile(path.join(THEMES_DIR, entry.name, "theme.json"), "utf-8")
          );
          console.log(`  ${themeJson.id} — ${themeJson.name} v${themeJson.version}`);
        } catch {
          console.log(`  ${entry.name} — (invalid theme)`);
        }
      }
    } catch {
      console.log("No themes directory found.");
    }
  });

// ─── Helpers ───

async function copyDir(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function parseLayoutInstructions(
  description: string,
  apiKey: string
): Promise<{ design: { primaryColor?: string; colorScheme?: string; font?: string; spacing?: string; corners?: string } }> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Parse this website layout description into JSON design tokens.

Description:
${description}

Return ONLY valid JSON with this structure (no explanation):
{
  "design": {
    "primaryColor": "#HEX",
    "secondaryColor": "#HEX",
    "accentColor": "#HEX",
    "backgroundColor": "#HEX or white",
    "textColor": "#HEX",
    "colorScheme": "light or dark",
    "font": "font family name",
    "spacing": "compact or comfortable or spacious",
    "corners": "sharp or rounded or pill"
  }
}`,
        },
      ],
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text ?? "{}";
  // Extract JSON from potential markdown code blocks
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
}

async function customizeTheme(
  themePath: string,
  instructions: { design: Record<string, string | undefined> }
) {
  const themeJsonPath = path.join(themePath, "theme.json");
  const themeJson = JSON.parse(await fs.readFile(themeJsonPath, "utf-8"));
  const d = instructions.design || {};

  if (d.primaryColor) themeJson.tokens.colors.primary = d.primaryColor;
  if (d.secondaryColor) themeJson.tokens.colors.secondary = d.secondaryColor;
  if (d.accentColor) themeJson.tokens.colors.accent = d.accentColor;
  if (d.backgroundColor) themeJson.tokens.colors.background = d.backgroundColor;
  if (d.textColor) themeJson.tokens.colors.text = d.textColor;
  if (d.font) {
    themeJson.tokens.typography.fontFamily.sans = `${d.font}, -apple-system, BlinkMacSystemFont, sans-serif`;
  }
  if (d.corners === "sharp") {
    themeJson.tokens.borderRadius = { none: "0", sm: "0", md: "0.125rem", lg: "0.25rem", xl: "0.375rem", full: "9999px" };
  } else if (d.corners === "pill") {
    themeJson.tokens.borderRadius = { none: "0", sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2rem", full: "9999px" };
  }

  await fs.writeFile(themeJsonPath, JSON.stringify(themeJson, null, 2));
}

program.parse();
```

- [ ] **Step 2: Verify the CLI works**

Run: `npx tsx scripts/generate-theme.ts list`
Expected: Shows `cortex-default — Cortex Default v1.0.0`

Run: `npx tsx scripts/generate-theme.ts generate --description "Modern SaaS landing page. Colors: Purple (#8B5CF6). Style: Rounded, spacious" --name test-theme`
Expected: Theme copied to `themes/test-theme/`, with AI customization if ANTHROPIC_API_KEY is set.

Run: `npx tsx scripts/generate-theme.ts activate test-theme`
Expected: Config written to `.cortex/config.json`.

Clean up: Remove test theme directory.

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-theme.ts
git commit -m "feat: AI theme generator CLI (generate, activate, list)"
```

---

## Task 16: Seed Script

**Files:**
- Create: `scripts/seed.ts`

- [ ] **Step 1: Create scripts/seed.ts**

```ts
#!/usr/bin/env node

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { posts } from "../modules/blog/entities/post";
import { comments } from "../modules/blog/entities/comment";

const connectionString = process.env.DATABASE_URL || "postgresql://cortex:cortex@localhost:5432/cortex";
const client = postgres(connectionString);
const db = drizzle(client);

async function seed() {
  console.log("Seeding database...\n");

  // Create sample posts
  const [post1] = await db
    .insert(posts)
    .values({
      title: "Welcome to Cortex",
      slug: "welcome-to-cortex",
      content:
        "Cortex is an AI-first web framework that treats AI agents as first-class citizens.\n\nWith module auto-discovery, MCP integration, and GTM data layer built in, you can build sophisticated applications where both humans and AI work together.\n\nDrop a folder in /modules and everything registers automatically — routes, entities, MCP tools, and events. No configuration needed.",
      excerpt: "Cortex is an AI-first web framework that treats AI agents as first-class citizens.",
      status: "published",
      author: "Cortex Team",
      tags: ["announcement", "getting-started"],
      publishedAt: new Date(),
    })
    .returning();

  const [post2] = await db
    .insert(posts)
    .values({
      title: "Building Modules with Cortex",
      slug: "building-modules-with-cortex",
      content:
        "Every Cortex module follows a simple convention: create a folder in /modules with a module.json, entities, and API handlers.\n\nThe framework auto-discovers everything on startup. Your entities become database tables, your API handlers become REST endpoints, and MCP tools are generated automatically.\n\nNo registration, no configuration, no boilerplate.",
      excerpt: "Learn how to create modules that auto-register entities, APIs, and MCP tools.",
      status: "published",
      author: "Cortex Team",
      tags: ["tutorial", "modules"],
      publishedAt: new Date(Date.now() - 86400000),
    })
    .returning();

  const [post3] = await db
    .insert(posts)
    .values({
      title: "MCP Integration: AI Agents as First-Class Citizens",
      slug: "mcp-integration-ai-agents",
      content:
        "Cortex exposes every entity as MCP tools automatically. AI agents can discover schemas, search APIs, and perform CRUD operations through the Model Context Protocol.\n\nConnect Claude Code, Cursor, or any MCP-compatible client to manage your application content, moderate comments, and trigger workflows — all through structured tool calls.",
      excerpt: "How Cortex makes every module accessible to AI agents through MCP.",
      status: "published",
      author: "Cortex Team",
      tags: ["mcp", "ai", "tutorial"],
      publishedAt: new Date(Date.now() - 172800000),
    })
    .returning();

  // Create sample comments
  await db.insert(comments).values([
    {
      postId: post1.id,
      authorName: "Developer",
      authorEmail: "dev@example.com",
      content: "This is exactly what I've been looking for. AI-native framework!",
      status: "approved",
    },
    {
      postId: post2.id,
      authorName: "Builder",
      authorEmail: "builder@example.com",
      content: "The auto-discovery is brilliant. Zero config is the way to go.",
      status: "approved",
    },
  ]);

  console.log("Seeded:");
  console.log(`  - 3 blog posts`);
  console.log(`  - 2 comments\n`);
  console.log("Done!");

  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Run seed**

Run: `npx tsx scripts/seed.ts`
Expected: "Seeded: 3 blog posts, 2 comments"

- [ ] **Step 3: Commit**

```bash
git add scripts/seed.ts
git commit -m "feat: database seed script with sample blog posts and comments"
```

---

## Task 17: Documentation

**Files:**
- Create: `AGENTS.md`
- Create: `README.md`
- Create: `.cortex/layout-instructions.example.md`

- [ ] **Step 1: Create AGENTS.md**

```markdown
# AGENTS.md — Cortex Framework

## Overview
Cortex is an AI-first web framework. AI agents are first-class citizens — every module's entities, APIs, and events are automatically exposed as MCP tools.

## Architecture
- **Runtime:** Node.js + Next.js 15 App Router
- **Database:** PostgreSQL with Drizzle ORM
- **Module System:** Auto-discovery from `/modules` and `/plugins` directories
- **Theme System:** Auto-discovery from `/themes` directory
- **MCP Server:** HTTP at `/api/mcp`, stdio via `scripts/mcp-stdio.ts`
- **Event Bus:** In-process pub/sub with PostgreSQL persistence
- **Data Layer:** Domain events bridge to GTM `window.dataLayer`

## MCP Connection

### stdio (for Claude Code / Cursor)
```json
{
  "mcpServers": {
    "cortex": {
      "command": "npx",
      "args": ["tsx", "scripts/mcp-stdio.ts"],
      "cwd": "/path/to/cortex"
    }
  }
}
```

### HTTP
POST `http://localhost:3000/api/mcp`

## Available MCP Tools

### Core Discovery
- `list_modules` — List all registered modules
- `get_module_spec(moduleId)` — Read module's AGENTS.md
- `discover_schema(query)` — Search entity schemas
- `find_api(query)` — Search API endpoints

### Auto-Generated Per Entity
For each entity (e.g., post, comment):
- `create_{entity}(data)` — Create record
- `get_{entity}(id)` — Get by ID
- `list_{entities}(page?, perPage?, search?)` — List with filters
- `update_{entity}(id, data)` — Update record
- `delete_{entity}(id)` — Delete record

### Blog Module Custom Tools
- `publish_post(postId)` — Publish a draft post
- `search_posts(query, limit?)` — Full-text search posts

### Theme Tools
- `generate_theme_from_description(description, themeName)` — Generate theme from text description

## Modules
Each module lives in `/modules/{name}/` with:
- `module.json` — Metadata, dependencies, entity list, events, data layer mappings
- `AGENTS.md` — AI-readable documentation
- `entities/*.ts` — Drizzle table schemas
- `api/*.ts` — REST API handlers
- `mcp-tools.ts` — Custom MCP tools
- `events.ts` — Event definitions and subscribers

## API Pattern
All APIs return: `{ success: boolean, data?, error?: { code, message, aiHint? }, metadata?: { total, page, perPage, executionTimeMs } }`

## Quick Commands
- `npm run dev` — Start development server
- `npm run seed` — Seed database with sample data
- `npm run mcp` — Start stdio MCP server
- `npm run theme:generate -- --file .cortex/my-layout.md --name my-site` — Generate theme
- `npm run theme:activate my-site` — Activate theme
- `npm run theme:list` — List themes
```

- [ ] **Step 2: Create README.md**

```markdown
# Cortex — AI-First Web Framework

Build web applications where AI agents are first-class citizens. Module auto-discovery, MCP integration, and GTM tracking built in.

## Quick Start (10 minutes)

### 1. Clone and Install

```bash
git clone <repo-url>
cd cortex
npm install
```

### 2. Start Infrastructure

```bash
docker compose up -d    # PostgreSQL + Redis
```

### 3. Set Up Database

```bash
cp .env.example .env.local
npx drizzle-kit migrate
npm run seed            # Sample blog posts
```

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000

### What You Get

- Professional landing page with theme system
- Blog with 3 sample posts at /blog
- Admin dashboard at /admin
- REST API at /api/modules/blog/posts
- MCP server for AI agents
- GTM data layer for marketing analytics

## Generate a Custom Theme (Optional)

### 1. Describe Your Website

Create `.cortex/my-site.md`:

```
Modern SaaS landing page with:
- Fixed header with logo left, navigation right
- Full-screen hero with centered headline
- 3-column features section
- Footer with 3 columns

Colors: Purple primary (#8B5CF6), white background
Font: Clean sans-serif
Style: Modern, spacious, rounded corners
```

### 2. Generate

```bash
# Without AI (copies default theme):
npm run theme:generate -- --file .cortex/my-site.md --name my-site

# With AI customization (set ANTHROPIC_API_KEY in .env.local first):
npm run theme:generate -- --file .cortex/my-site.md --name my-site
```

### 3. Activate

```bash
npm run theme:activate my-site
npm run dev
```

## MCP Integration

Connect Claude Code or Cursor to manage your Cortex app:

```json
{
  "mcpServers": {
    "cortex": {
      "command": "npx",
      "args": ["tsx", "scripts/mcp-stdio.ts"],
      "cwd": "/path/to/cortex"
    }
  }
}
```

AI agents can then: create posts, search content, moderate comments, discover schemas, and more.

## API Reference

### Blog Posts
```
GET    /api/modules/blog/posts          # List (filter: status, tag, search)
POST   /api/modules/blog/posts          # Create (body: { title, content, author, tags })
GET    /api/modules/blog/posts/:id      # Get by ID
PUT    /api/modules/blog/posts/:id      # Update
DELETE /api/modules/blog/posts/:id      # Delete
POST   /api/modules/blog/posts/:id/publish  # Publish draft
```

### Comments
```
GET    /api/modules/blog/comments       # List (filter: postId)
POST   /api/modules/blog/comments       # Create
GET    /api/modules/blog/comments/:id   # Get
PUT    /api/modules/blog/comments/:id   # Update
DELETE /api/modules/blog/comments/:id   # Delete
```

### System
```
GET    /api/health                      # Health check
POST   /api/mcp                         # MCP HTTP endpoint
```

## Project Structure

```
cortex/
├── src/core/           # Framework core (module registry, event bus, MCP, themes)
├── src/app/            # Next.js pages and API routes
├── modules/blog/       # Blog module (auto-discovered)
├── themes/default/     # Default theme (Tailwind UI quality)
├── scripts/            # CLI tools (seed, MCP stdio, theme generator)
└── docker-compose.yml  # PostgreSQL + Redis
```

## Creating a Module

1. Create `modules/my-module/module.json`
2. Add entities in `modules/my-module/entities/`
3. Add API handlers in `modules/my-module/api/`
4. Restart dev server — everything auto-registers

See `modules/blog/` for a complete example and `modules/blog/AGENTS.md` for AI documentation format.

## Tech Stack

Next.js 15 | TypeScript | PostgreSQL | Drizzle ORM | Tailwind CSS 4 | MCP SDK | Zod
```

- [ ] **Step 3: Create .cortex/layout-instructions.example.md**

```markdown
# Website Layout Instructions

Describe your website layout in plain English. The Cortex theme generator will create a professional theme from your description.

## Example 1: SaaS Landing Page

```
Modern SaaS landing page with:
- Fixed header with logo on left, navigation on right, "Sign Up" button
- Full-screen hero with centered headline, subtitle, and CTA button
- 3-column features section with icons
- Testimonials section
- Newsletter signup section
- Footer with 3 columns: Product, Company, Legal

Colors: Blue primary (#0066FF), white background
Font: Clean sans-serif (Inter)
Style: Modern, spacious, rounded corners
```

## Example 2: Business Website

```
Professional business website:
- Fixed header with logo and horizontal navigation
- Split hero: left side text with CTA, right side image
- 4 service boxes in grid layout
- About section with team description
- Contact form section
- Footer with 4 columns and social icons

Colors: Navy blue (#002855), gold accent (#C5A572)
Font: Professional serif for headings, sans-serif for body
Style: Elegant, traditional, subtle shadows
```

## Example 3: Portfolio / Personal Site

```
Minimalist portfolio site:
- Static header with just name and simple menu
- Large hero with photo and short bio
- Project grid (3 columns)
- Skills section
- Simple footer with social links

Colors: Dark mode - charcoal (#1F2937), white text, teal accent (#14B8A6)
Font: Modern monospace for headings, sans-serif for body
Style: Minimal, dark theme, sharp corners
```

## Your Layout

Replace this with your description:

```
[DESCRIBE YOUR LAYOUT HERE]
```

## Design Preferences (Optional)

- **Color Scheme:** light / dark / auto
- **Primary Color:** #HEX
- **Font Family:** font name or style description
- **Spacing:** compact / comfortable / spacious
- **Corners:** sharp / rounded / pill-shaped
```

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md README.md .cortex/
git commit -m "feat: documentation (AGENTS.md, README, layout instructions examples)"
```

---

## Task 18: Final Wiring and Verification

- [ ] **Step 1: Verify complete boot sequence**

Run: `docker compose up -d`
Run: `npx drizzle-kit migrate`
Run: `npm run seed`
Run: `npm run dev`

Expected console output:
```
[Cortex] Discovered 1 module(s): blog
[Cortex] Discovered 1 theme(s): cortex-default
[Cortex] Framework initialized
```

- [ ] **Step 2: Test all API endpoints**

Run: `curl -s http://localhost:3000/api/health | python3 -m json.tool`
Expected: `"status": "ok"`

Run: `curl -s http://localhost:3000/api/modules/blog/posts | python3 -m json.tool`
Expected: List of 3 seeded posts

Run: `curl -s -X POST http://localhost:3000/api/modules/blog/posts -H 'Content-Type: application/json' -d '{"title":"Test Post","content":"Hello from API"}' | python3 -m json.tool`
Expected: `"success": true` with new post

- [ ] **Step 3: Test all pages render**

Visit: `http://localhost:3000` — Landing page with hero, features, how-it-works
Visit: `http://localhost:3000/blog` — Blog list with seeded posts
Visit: `http://localhost:3000/blog/welcome-to-cortex` — Single post page
Visit: `http://localhost:3000/admin` — Dashboard with stats

- [ ] **Step 4: Test theme CLI**

Run: `npm run theme:list`
Expected: Shows cortex-default

Run: `npm run theme:generate -- --description "Dark tech site, green accent #10B981, monospace" --name dark-tech`
Expected: Theme generated at `themes/dark-tech/`

- [ ] **Step 5: Verify dataLayer**

Open browser console on `http://localhost:3000`.
Run: `console.log(window.dataLayer)`
Expected: Array exists (may be empty if no events fired client-side). Creating a post via API should add events.

- [ ] **Step 6: Final commit with any fixes**

```bash
git add -A
git commit -m "feat: final wiring and verification"
```

- [ ] **Step 7: Create GitHub repository**

```bash
gh repo create cortex --public --description "AI-First Web Framework" --source . --push
```

Or if `gh` is not configured, push manually:
```bash
git remote add origin <your-github-url>
git push -u origin main
```
