#!/usr/bin/env node

/**
 * Database seed script for Cortex.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Requires a running PostgreSQL instance (see docker-compose.yml).
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { posts } from "../modules/blog/entities/post";
import { comments } from "../modules/blog/entities/comment";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://cortex:cortex@localhost:5432/cortex";

const client = postgres(connectionString);
const db = drizzle(client);

async function seed() {
  console.log("Seeding database...\n");

  // --- Posts ---

  const [post1] = await db
    .insert(posts)
    .values({
      title: "Welcome to Cortex",
      slug: "welcome-to-cortex",
      content: `Cortex is an AI-first web framework built on Next.js. It treats AI agents as first-class citizens through the Model Context Protocol (MCP), giving them the same structured access to your application that human users enjoy through the UI.

Every module in Cortex automatically exposes its entities, API endpoints, and events to AI agents. No extra glue code needed.

Whether you're building a blog, a SaaS dashboard, or an e-commerce storefront, Cortex gives you a structured, extensible foundation with built-in AI superpowers.`,
      excerpt:
        "Introducing Cortex, the AI-first web framework that treats AI agents as first-class citizens.",
      status: "published",
      author: "Cortex Team",
      tags: ["announcement", "getting-started"],
      publishedAt: new Date("2025-01-15T10:00:00Z"),
      createdAt: new Date("2025-01-15T09:00:00Z"),
      updatedAt: new Date("2025-01-15T10:00:00Z"),
    })
    .returning();

  console.log(`  Created post: "${post1.title}" (${post1.id})`);

  const [post2] = await db
    .insert(posts)
    .values({
      title: "Building Modules with Cortex",
      slug: "building-modules-with-cortex",
      content: `Modules are the fundamental building block of a Cortex application. Each module is a self-contained unit that encapsulates entities, API handlers, events, MCP tools, and UI components.

## Module Structure

A module lives in the modules/ directory and follows this structure:

- module.json — Manifest file with metadata, entity list, events, and data layer mappings
- entities/ — Drizzle ORM table definitions
- api/ — API route handlers (GET, POST, PUT, DELETE)
- events.ts — Domain event definitions and subscribers
- mcp-tools.ts — Custom MCP tools for AI agents
- components/ — React components specific to this module
- AGENTS.md — AI-readable documentation

## Creating a Module

1. Create a new directory under modules/
2. Add a module.json manifest
3. Define your entities with Drizzle ORM
4. Write API handlers following the Cortex patterns
5. Run migrations and start developing

The module registry will automatically discover your module on startup.`,
      excerpt:
        "Learn how to build self-contained modules with entities, APIs, events, and MCP integration.",
      status: "published",
      author: "Cortex Team",
      tags: ["tutorial", "modules"],
      publishedAt: new Date("2025-02-01T12:00:00Z"),
      createdAt: new Date("2025-02-01T11:00:00Z"),
      updatedAt: new Date("2025-02-01T12:00:00Z"),
    })
    .returning();

  console.log(`  Created post: "${post2.title}" (${post2.id})`);

  const [post3] = await db
    .insert(posts)
    .values({
      title: "MCP Integration: AI Agents as First-Class Citizens",
      slug: "mcp-integration-ai-agents-first-class",
      content: `The Model Context Protocol (MCP) is the backbone of Cortex's AI-first architecture. It provides a standardized way for AI agents to discover, understand, and interact with your application.

## How It Works

When Cortex starts, it scans all modules and automatically registers:

1. **Discovery tools** — list_modules, get_module_spec, discover_schema, find_api
2. **CRUD tools** — Auto-generated create, read, update, delete tools for every entity
3. **Custom tools** — Module-specific tools defined in mcp-tools.ts

## Connecting an AI Agent

### stdio (for Claude Desktop, Cursor, etc.)
Add to your MCP config:
\`\`\`json
{
  "mcpServers": {
    "cortex": {
      "command": "npx",
      "args": ["tsx", "scripts/mcp-stdio.ts"]
    }
  }
}
\`\`\`

### HTTP (for web-based agents)
POST to /api/mcp with JSON-RPC messages.

## What Agents Can Do

With MCP access, an AI agent can:
- Discover all modules, entities, and API endpoints
- Read any module's AGENTS.md documentation
- Create, read, update, and delete any entity
- Call custom module tools (e.g., publish_post, search_posts)
- Search across entity schemas and API routes`,
      excerpt:
        "Deep dive into how Cortex uses the Model Context Protocol to give AI agents structured access to your application.",
      status: "published",
      author: "Cortex Team",
      tags: ["mcp", "ai", "tutorial"],
      publishedAt: new Date("2025-02-15T14:00:00Z"),
      createdAt: new Date("2025-02-15T13:00:00Z"),
      updatedAt: new Date("2025-02-15T14:00:00Z"),
    })
    .returning();

  console.log(`  Created post: "${post3.title}" (${post3.id})`);

  // --- Comments ---

  const [comment1] = await db
    .insert(comments)
    .values({
      postId: post1.id,
      authorName: "Alex Developer",
      authorEmail: "alex@example.com",
      content:
        "This is exactly what I've been looking for! The MCP integration is a game-changer for building AI-powered apps.",
      status: "approved",
    })
    .returning();

  console.log(`  Created comment on "${post1.title}" by ${comment1.authorName}`);

  const [comment2] = await db
    .insert(comments)
    .values({
      postId: post2.id,
      authorName: "Sam Builder",
      authorEmail: "sam@example.com",
      content:
        "Great tutorial! The module structure is clean and easy to follow. Built my first custom module in under an hour.",
      status: "approved",
    })
    .returning();

  console.log(`  Created comment on "${post2.title}" by ${comment2.authorName}`);

  console.log("\nSeed complete.");
}

seed()
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await client.end();
  });
