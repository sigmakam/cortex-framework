#!/usr/bin/env node

/**
 * MCP stdio transport for CLI-based AI agents (e.g. Claude Desktop, Cursor).
 *
 * Usage:
 *   npx tsx scripts/mcp-stdio.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

async function main() {
  const { moduleRegistry } = await import("../src/core/module-registry");
  const { themeRegistry } = await import("../src/core/theme-registry");

  // Load blog module (same as instrumentation.ts but for standalone use)
  const blogManifestPath = path.join(process.cwd(), "modules/blog/module.json");
  if (fs.existsSync(blogManifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(blogManifestPath, "utf-8"));

    const postEntity = await import("../modules/blog/entities/post");
    const commentEntity = await import("../modules/blog/entities/comment");
    const postsApi = await import("../modules/blog/api/posts");
    const commentsApi = await import("../modules/blog/api/comments");
    const blogEvents = await import("../modules/blog/events");

    let mcpTools: any[] = [];
    try {
      const mcpModule = await import("../modules/blog/mcp-tools");
      mcpTools = mcpModule.tools ?? [];
    } catch { /* no mcp-tools */ }

    const apiHandlers: Record<string, any> = {};
    for (const [route, handler] of Object.entries(postsApi.handlers)) {
      apiHandlers[`posts:${route}`] = handler;
    }
    for (const [route, handler] of Object.entries(commentsApi.handlers)) {
      apiHandlers[`comments:${route}`] = handler;
    }

    const dataLayerMappings: any[] = [];
    if (manifest.dataLayer) {
      for (const [domainEvent, config] of Object.entries(manifest.dataLayer as Record<string, any>)) {
        dataLayerMappings.push({ domainEvent, dataLayerEvent: config.event, params: config.params });
      }
    }

    let agentsMd = "";
    const agentsMdPath = path.join(process.cwd(), "modules/blog/AGENTS.md");
    if (fs.existsSync(agentsMdPath)) {
      agentsMd = fs.readFileSync(agentsMdPath, "utf-8");
    }

    moduleRegistry.registerModule({
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      enabled: manifest.enabled,
      dependencies: manifest.dependencies ?? [],
      path: path.join(process.cwd(), "modules/blog"),
      entities: { post: postEntity, comment: commentEntity },
      apiHandlers,
      mcpTools,
      events: blogEvents.events ?? { publishes: [], subscribers: {} },
      dataLayerMappings,
      agentsMd,
    });
  }

  // Load themes
  const themesDir = path.join(process.cwd(), "themes");
  if (fs.existsSync(themesDir)) {
    for (const entry of fs.readdirSync(themesDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const themeJsonPath = path.join(themesDir, entry.name, "theme.json");
      if (!fs.existsSync(themeJsonPath)) continue;
      try {
        const config = JSON.parse(fs.readFileSync(themeJsonPath, "utf-8"));
        themeRegistry.registerTheme(config, path.join(themesDir, entry.name));
      } catch { /* skip invalid themes */ }
    }
  }

  const { createMcpServer } = await import("../src/core/mcp-server");
  const server = createMcpServer();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("[Cortex MCP] stdio server running");
}

main().catch((err) => {
  console.error("MCP stdio server error:", err);
  process.exit(1);
});
