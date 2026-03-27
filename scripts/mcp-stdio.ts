#!/usr/bin/env node

/**
 * MCP stdio transport for CLI-based AI agents (e.g. Claude Desktop, Cursor).
 *
 * Usage:
 *   npx tsx scripts/mcp-stdio.ts
 *
 * Or add to claude_desktop_config.json:
 *   { "mcpServers": { "cortex": { "command": "npx", "args": ["tsx", "scripts/mcp-stdio.ts"] } } }
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

async function main() {
  // Must discover modules first since we are not in the Next.js context
  const { moduleRegistry } = await import("../src/core/module-registry");
  await moduleRegistry.discoverModules();

  const { createMcpServer } = await import("../src/core/mcp-server");
  const server = createMcpServer();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr so it doesn't interfere with the JSON-RPC protocol on stdout
  console.error("[Cortex MCP] stdio server running");
}

main().catch((err) => {
  console.error("MCP stdio server error:", err);
  process.exit(1);
});
