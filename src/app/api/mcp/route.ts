import { NextRequest } from "next/server";
import { createMcpServer } from "@/core/mcp-server";
import { moduleRegistry } from "@/core/module-registry";
import { ensureInitialized } from "@/core/init";

/**
 * MCP HTTP endpoint for AI agents.
 *
 * Uses a simple JSON-RPC approach that maps incoming requests to
 * the MCP server's tool list and tool call capabilities.
 *
 * Supported methods:
 *   POST { method: "tools/list" }
 *   POST { method: "tools/call", params: { name: "tool_name", arguments: {...} } }
 *   POST { method: "initialize" }
 *
 * This avoids the complexity of streaming SSE transports while giving
 * AI agents full access to MCP tools over a standard HTTP POST.
 */

// Cache the server instance per cold start (singleton within the serverless function)
let mcpServer: ReturnType<typeof createMcpServer> | null = null;

async function getServer() {
  if (!mcpServer) {
    await ensureInitialized();
    mcpServer = createMcpServer();
  }
  return mcpServer;
}

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: number | string;
  method: string;
  params?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  let body: JsonRpcRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        jsonrpc: "2.0",
        error: { code: -32700, message: "Parse error: invalid JSON" },
        id: null,
      },
      { status: 400 }
    );
  }

  const { method, params, id = null } = body;
  const server = await getServer();

  try {
    switch (method) {
      case "initialize": {
        return Response.json({
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            serverInfo: { name: "cortex", version: "1.0.0" },
            capabilities: { tools: {} },
          },
        });
      }

      case "tools/list": {
        // Gather all registered tools from the MCP server by introspecting
        // the module registry (the McpServer SDK does not expose a simple list API
        // outside of the protocol flow, so we reconstruct the list here).
        const modules = moduleRegistry.getAll();
        const tools: Array<{
          name: string;
          description: string;
          inputSchema: Record<string, unknown>;
        }> = [];

        // Discovery tools
        tools.push(
          {
            name: "list_modules",
            description:
              "List all registered Cortex modules with their entities, API endpoints, and MCP tools",
            inputSchema: { type: "object", properties: {} },
          },
          {
            name: "get_module_spec",
            description: "Get a module's AGENTS.md specification for AI agents",
            inputSchema: {
              type: "object",
              properties: {
                moduleId: { type: "string", description: "The module ID to look up" },
              },
              required: ["moduleId"],
            },
          },
          {
            name: "discover_schema",
            description: "Search entity schemas across all modules by keyword",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search term to match against entity names",
                },
              },
              required: ["query"],
            },
          },
          {
            name: "find_api",
            description: "Search API endpoints across all modules by keyword",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search term to match against API route paths",
                },
              },
              required: ["query"],
            },
          }
        );

        // Auto-generated CRUD tools per resource
        for (const mod of modules) {
          const resources = new Set<string>();
          for (const key of Object.keys(mod.apiHandlers)) {
            const colonIdx = key.indexOf(":");
            if (colonIdx !== -1) resources.add(key.slice(0, colonIdx));
          }

          for (const plural of resources) {
            const singular = plural.endsWith("s")
              ? plural.slice(0, -1)
              : plural;

            tools.push(
              {
                name: `create_${singular}`,
                description: `Create a new ${singular} in the ${mod.name} module`,
                inputSchema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      description: `Fields for the new ${singular}`,
                    },
                  },
                  required: ["data"],
                },
              },
              {
                name: `get_${singular}`,
                description: `Get a single ${singular} by ID from the ${mod.name} module`,
                inputSchema: {
                  type: "object",
                  properties: {
                    id: { type: "string", description: `The ${singular} ID` },
                  },
                  required: ["id"],
                },
              },
              {
                name: `list_${plural}`,
                description: `List ${plural} from the ${mod.name} module with optional pagination and search`,
                inputSchema: {
                  type: "object",
                  properties: {
                    page: { type: "number", description: "Page number (default: 1)" },
                    perPage: {
                      type: "number",
                      description: "Items per page (default: 10)",
                    },
                    search: { type: "string", description: "Search query" },
                  },
                },
              },
              {
                name: `update_${singular}`,
                description: `Update an existing ${singular} by ID in the ${mod.name} module`,
                inputSchema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      description: `The ${singular} ID to update`,
                    },
                    data: {
                      type: "object",
                      description: `Fields to update on the ${singular}`,
                    },
                  },
                  required: ["id", "data"],
                },
              },
              {
                name: `delete_${singular}`,
                description: `Delete a ${singular} by ID from the ${mod.name} module`,
                inputSchema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      description: `The ${singular} ID to delete`,
                    },
                  },
                  required: ["id"],
                },
              }
            );
          }
        }

        // Module custom tools
        for (const tool of moduleRegistry.getAllMcpTools()) {
          tools.push({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
          });
        }

        return Response.json({
          jsonrpc: "2.0",
          id,
          result: { tools },
        });
      }

      case "tools/call": {
        const toolName = (params as { name?: string })?.name;
        const toolArgs = (params as { arguments?: Record<string, unknown> })
          ?.arguments ?? {};

        if (!toolName) {
          return Response.json(
            {
              jsonrpc: "2.0",
              id,
              error: {
                code: -32602,
                message: "Missing required param: name",
              },
            },
            { status: 400 }
          );
        }

        // Route to the appropriate handler by calling the tool through
        // the same logic as createMcpServer. We re-use the handler functions
        // by dispatching based on the tool name.
        const result = await dispatchToolCall(toolName, toolArgs);

        return Response.json({
          jsonrpc: "2.0",
          id,
          result,
        });
      }

      default: {
        return Response.json(
          {
            jsonrpc: "2.0",
            id,
            error: {
              code: -32601,
              message: `Method '${method}' not supported. Use initialize, tools/list, or tools/call.`,
            },
          },
          { status: 400 }
        );
      }
    }
  } catch (err) {
    console.error("[MCP Route] Error:", err);
    return Response.json(
      {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32603,
          message:
            err instanceof Error ? err.message : "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}

// Also support GET for health/info
export async function GET() {
  return Response.json({
    name: "cortex-mcp",
    version: "1.0.0",
    description:
      "Cortex MCP server. POST JSON-RPC requests with methods: initialize, tools/list, tools/call",
    endpoints: {
      "POST /api/mcp": {
        initialize: "Initialize the MCP session",
        "tools/list": "List all available tools",
        "tools/call":
          'Call a tool: { method: "tools/call", params: { name: "...", arguments: {...} } }',
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Tool dispatcher — mirrors the logic in mcp-server.ts but for HTTP
// ---------------------------------------------------------------------------

async function dispatchToolCall(
  toolName: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const format = (result: unknown) => ({
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  });

  // --- Discovery tools ---

  if (toolName === "list_modules") {
    const modules = moduleRegistry.getAll();
    return format({
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
    });
  }

  if (toolName === "get_module_spec") {
    const moduleId = args.moduleId as string;
    const mod = moduleRegistry.get(moduleId);
    if (!mod) {
      return format({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Module '${moduleId}' not found`,
          aiHint: "Use list_modules to see available modules",
        },
      });
    }
    return format({
      success: true,
      data: {
        moduleId: mod.id,
        agentsMd: mod.agentsMd || "(no AGENTS.md found for this module)",
      },
    });
  }

  if (toolName === "discover_schema") {
    const query = (args.query as string).toLowerCase();
    const allEntities = moduleRegistry.getAllEntities();
    const matches: Array<{ name: string; info: unknown }> = [];
    for (const [fullName, entity] of Object.entries(allEntities)) {
      if (fullName.toLowerCase().includes(query)) {
        matches.push({ name: fullName, info: entity });
      }
    }
    return format({ success: true, data: matches, metadata: { total: matches.length } });
  }

  if (toolName === "find_api") {
    const query = (args.query as string).toLowerCase();
    const matches: Array<{ moduleId: string; routeKey: string; apiPath: string }> = [];
    for (const mod of moduleRegistry.getAll()) {
      for (const routeKey of Object.keys(mod.apiHandlers)) {
        const fullPath = `/api/modules/${mod.id}/${routeKey}`;
        if (
          routeKey.toLowerCase().includes(query) ||
          fullPath.toLowerCase().includes(query)
        ) {
          matches.push({ moduleId: mod.id, routeKey, apiPath: fullPath });
        }
      }
    }
    return format({ success: true, data: matches, metadata: { total: matches.length } });
  }

  // --- Module custom tools ---
  const customTools = moduleRegistry.getAllMcpTools();
  const customTool = customTools.find((t) => t.name === toolName);
  if (customTool) {
    const result = await customTool.handler(args);
    return format(result);
  }

  // --- CRUD tools (pattern: create_X, get_X, list_Xs, update_X, delete_X) ---
  const crudMatch = toolName.match(
    /^(create|get|list|update|delete)_(.+)$/
  );
  if (crudMatch) {
    const [, action, resourcePart] = crudMatch;
    // For "list_posts" → plural="posts", for "create_post" → singular="post"
    const modules = moduleRegistry.getAll();

    for (const mod of modules) {
      const handlerKeys = Object.keys(mod.apiHandlers);
      const resources = new Set<string>();
      for (const key of handlerKeys) {
        const colonIdx = key.indexOf(":");
        if (colonIdx !== -1) resources.add(key.slice(0, colonIdx));
      }

      for (const plural of resources) {
        const singular = plural.endsWith("s") ? plural.slice(0, -1) : plural;

        const isMatch =
          (action === "list" && resourcePart === plural) ||
          (action !== "list" && resourcePart === singular);

        if (!isMatch) continue;

        const callHandler = async (routeKey: string, ctx: { params: Record<string, string>; searchParams: Record<string, string>; body?: unknown }) => {
          const handler = mod.apiHandlers[routeKey];
          if (!handler) {
            return {
              success: false as const,
              error: {
                code: "NOT_FOUND",
                message: `Handler '${routeKey}' not found in module '${mod.id}'`,
                aiHint: `Available: ${handlerKeys.join(", ")}`,
              },
            };
          }
          return handler(ctx);
        };

        switch (action) {
          case "create": {
            const result = await callHandler(`${plural}:POST /`, {
              params: {},
              searchParams: {},
              body: args.data,
            });
            return format(result);
          }
          case "get": {
            const result = await callHandler(`${plural}:GET /:id`, {
              params: { id: args.id as string },
              searchParams: {},
            });
            return format(result);
          }
          case "list": {
            const searchParams: Record<string, string> = {};
            if (args.page !== undefined) searchParams.page = String(args.page);
            if (args.perPage !== undefined)
              searchParams.perPage = String(args.perPage);
            if (args.search !== undefined)
              searchParams.search = args.search as string;
            const result = await callHandler(`${plural}:GET /`, {
              params: {},
              searchParams,
            });
            return format(result);
          }
          case "update": {
            const result = await callHandler(`${plural}:PUT /:id`, {
              params: { id: args.id as string },
              searchParams: {},
              body: args.data,
            });
            return format(result);
          }
          case "delete": {
            const result = await callHandler(`${plural}:DELETE /:id`, {
              params: { id: args.id as string },
              searchParams: {},
            });
            return format(result);
          }
        }
      }
    }
  }

  // Tool not found
  return format({
    success: false,
    error: {
      code: "TOOL_NOT_FOUND",
      message: `Tool '${toolName}' not found`,
      aiHint: "Use tools/list to see available tools",
    },
  });
}
