import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { moduleRegistry } from "./module-registry";
import type { ApiContext, ToolResponse, CortexModule } from "./types";

/**
 * Creates and configures the Cortex MCP server with:
 * - 4 core discovery tools (list_modules, get_module_spec, discover_schema, find_api)
 * - Auto-generated CRUD tools for every entity resource
 * - Module custom tools from mcp-tools.ts files
 */
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "cortex",
    version: "1.0.0",
  });

  registerDiscoveryTools(server);
  registerEntityCrudTools(server);
  registerModuleCustomTools(server);

  return server;
}

// ---------------------------------------------------------------------------
// Helper: format a ToolResponse as MCP content
// ---------------------------------------------------------------------------

function formatResult(result: ToolResponse) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}

// ---------------------------------------------------------------------------
// Core Discovery Tools
// ---------------------------------------------------------------------------

function registerDiscoveryTools(server: McpServer) {
  // 1. list_modules
  server.tool(
    "list_modules",
    "List all registered Cortex modules with their entities, API endpoints, and MCP tools",
    async () => {
      const modules = moduleRegistry.getAll();
      const result: ToolResponse = {
        success: true,
        data: modules.map((mod) => ({
          id: mod.id,
          name: mod.name,
          version: mod.version,
          description: mod.description,
          enabled: mod.enabled,
          entities: Object.keys(mod.entities),
          apiEndpoints: Object.keys(mod.apiHandlers),
          mcpTools: mod.mcpTools.map((t) => t.name),
        })),
      };
      return formatResult(result);
    }
  );

  // 2. get_module_spec
  server.tool(
    "get_module_spec",
    "Get a module's AGENTS.md specification for AI agents",
    { moduleId: z.string().describe("The module ID to look up") },
    async ({ moduleId }) => {
      const mod = moduleRegistry.get(moduleId);
      if (!mod) {
        return formatResult({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `Module '${moduleId}' not found`,
            aiHint: "Use list_modules to see available modules",
          },
        });
      }
      return formatResult({
        success: true,
        data: {
          moduleId: mod.id,
          agentsMd: mod.agentsMd || "(no AGENTS.md found for this module)",
        },
      });
    }
  );

  // 3. discover_schema
  server.tool(
    "discover_schema",
    "Search entity schemas across all modules by keyword",
    { query: z.string().describe("Search term to match against entity names") },
    async ({ query }) => {
      const allEntities = moduleRegistry.getAllEntities();
      const lowerQuery = query.toLowerCase();
      const matches: Array<{ name: string; info: unknown }> = [];

      for (const [fullName, entity] of Object.entries(allEntities)) {
        if (fullName.toLowerCase().includes(lowerQuery)) {
          matches.push({ name: fullName, info: entity });
        }
      }

      return formatResult({
        success: true,
        data: matches,
        metadata: { total: matches.length },
      });
    }
  );

  // 4. find_api
  server.tool(
    "find_api",
    "Search API endpoints across all modules by keyword",
    { query: z.string().describe("Search term to match against API route paths") },
    async ({ query }) => {
      const lowerQuery = query.toLowerCase();
      const matches: Array<{
        moduleId: string;
        routeKey: string;
        apiPath: string;
      }> = [];

      for (const mod of moduleRegistry.getAll()) {
        for (const routeKey of Object.keys(mod.apiHandlers)) {
          // routeKey looks like "posts:GET /"
          const fullPath = `/api/modules/${mod.id}/${routeKey}`;
          if (
            routeKey.toLowerCase().includes(lowerQuery) ||
            fullPath.toLowerCase().includes(lowerQuery)
          ) {
            matches.push({
              moduleId: mod.id,
              routeKey,
              apiPath: fullPath,
            });
          }
        }
      }

      return formatResult({
        success: true,
        data: matches,
        metadata: { total: matches.length },
      });
    }
  );
}

// ---------------------------------------------------------------------------
// Auto-Generated Entity CRUD Tools
// ---------------------------------------------------------------------------

function registerEntityCrudTools(server: McpServer) {
  const modules = moduleRegistry.getAll();

  for (const mod of modules) {
    // Extract distinct resource names from API handler keys
    // Keys look like "posts:GET /", "posts:POST /", "comments:GET /:id"
    const resources = new Set<string>();
    for (const key of Object.keys(mod.apiHandlers)) {
      const colonIdx = key.indexOf(":");
      if (colonIdx !== -1) {
        resources.add(key.slice(0, colonIdx));
      }
    }

    for (const plural of resources) {
      const singular = plural.endsWith("s") ? plural.slice(0, -1) : plural;

      // Helper to call a module API handler
      const callHandler = async (
        routeKey: string,
        ctx: ApiContext
      ): Promise<ToolResponse> => {
        const handler = mod.apiHandlers[routeKey];
        if (!handler) {
          return {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: `Handler '${routeKey}' not found in module '${mod.id}'`,
              aiHint: `Available handlers: ${Object.keys(mod.apiHandlers).join(", ")}`,
            },
          };
        }
        return handler(ctx);
      };

      // create_{singular}
      server.tool(
        `create_${singular}`,
        `Create a new ${singular} in the ${mod.name} module`,
        {
          data: z
            .record(z.unknown())
            .describe(`Fields for the new ${singular}`),
        },
        async ({ data }) => {
          const result = await callHandler(`${plural}:POST /`, {
            params: {},
            searchParams: {},
            body: data,
          });
          return formatResult(result);
        }
      );

      // get_{singular}
      server.tool(
        `get_${singular}`,
        `Get a single ${singular} by ID from the ${mod.name} module`,
        {
          id: z.string().describe(`The ${singular} ID`),
        },
        async ({ id }) => {
          const result = await callHandler(`${plural}:GET /:id`, {
            params: { id },
            searchParams: {},
          });
          return formatResult(result);
        }
      );

      // list_{plural}
      server.tool(
        `list_${plural}`,
        `List ${plural} from the ${mod.name} module with optional pagination and search`,
        {
          page: z.number().optional().describe("Page number (default: 1)"),
          perPage: z
            .number()
            .optional()
            .describe("Items per page (default: 10)"),
          search: z.string().optional().describe("Search query"),
        },
        async ({ page, perPage, search }) => {
          const searchParams: Record<string, string> = {};
          if (page !== undefined) searchParams.page = String(page);
          if (perPage !== undefined) searchParams.perPage = String(perPage);
          if (search !== undefined) searchParams.search = search;

          const result = await callHandler(`${plural}:GET /`, {
            params: {},
            searchParams,
          });
          return formatResult(result);
        }
      );

      // update_{singular}
      server.tool(
        `update_${singular}`,
        `Update an existing ${singular} by ID in the ${mod.name} module`,
        {
          id: z.string().describe(`The ${singular} ID to update`),
          data: z
            .record(z.unknown())
            .describe(`Fields to update on the ${singular}`),
        },
        async ({ id, data }) => {
          const result = await callHandler(`${plural}:PUT /:id`, {
            params: { id },
            searchParams: {},
            body: data,
          });
          return formatResult(result);
        }
      );

      // delete_{singular}
      server.tool(
        `delete_${singular}`,
        `Delete a ${singular} by ID from the ${mod.name} module`,
        {
          id: z.string().describe(`The ${singular} ID to delete`),
        },
        async ({ id }) => {
          const result = await callHandler(`${plural}:DELETE /:id`, {
            params: { id },
            searchParams: {},
          });
          return formatResult(result);
        }
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Module Custom Tools
// ---------------------------------------------------------------------------

function registerModuleCustomTools(server: McpServer) {
  const customTools = moduleRegistry.getAllMcpTools();

  for (const tool of customTools) {
    // Module custom tools define inputSchema as a plain JSON Schema object.
    // We register them with a generic z.record schema and pass through
    // the raw input to the tool handler.
    server.tool(
      tool.name,
      tool.description,
      { input: z.record(z.unknown()).optional().describe("Tool input parameters") },
      async ({ input }) => {
        const result = await tool.handler(input ?? {});
        return formatResult(result);
      }
    );
  }
}
