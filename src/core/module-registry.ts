import * as path from "path";
import * as fs from "fs";
import type {
  CortexModule,
  ModuleManifest,
  ApiHandler,
  McpTool,
  DataLayerMapping,
  EventDefinitions,
  ApiContext,
} from "./types";

class ModuleRegistryImpl {
  private modules = new Map<string, CortexModule>();

  // --- Discovery ---

  async discoverModules(): Promise<void> {
    const dirs = [
      path.join(process.cwd(), "modules"),
      path.join(process.cwd(), "plugins"),
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue;

      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const modulePath = path.join(dir, entry.name);
        try {
          await this.loadModule(modulePath);
        } catch (err) {
          console.error(`[Cortex] Failed to load module at ${modulePath}:`, err);
        }
      }
    }

    console.log(`[Cortex] Discovered ${this.modules.size} module(s)`);
  }

  // --- Module Loading ---

  private async loadModule(modulePath: string): Promise<void> {
    const manifestPath = path.join(modulePath, "module.json");
    if (!fs.existsSync(manifestPath)) return;

    const manifestRaw = fs.readFileSync(manifestPath, "utf-8");
    const manifest: ModuleManifest = JSON.parse(manifestRaw);

    if (!manifest.enabled) {
      console.log(`[Cortex] Skipping disabled module: ${manifest.id}`);
      return;
    }

    // Load entities
    const entities: Record<string, unknown> = {};
    const entitiesDir = path.join(modulePath, "entities");
    if (fs.existsSync(entitiesDir)) {
      const entityFiles = fs
        .readdirSync(entitiesDir)
        .filter((f) => f.endsWith(".ts") || f.endsWith(".js"));
      for (const file of entityFiles) {
        const entityName = path.basename(file, path.extname(file));
        const entityModule = await import(path.join(entitiesDir, file));
        entities[entityName] = entityModule;
      }
    }

    // Load API handlers
    const apiHandlers: Record<string, ApiHandler> = {};
    const apiDir = path.join(modulePath, "api");
    if (fs.existsSync(apiDir)) {
      const apiFiles = fs
        .readdirSync(apiDir)
        .filter((f) => f.endsWith(".ts") || f.endsWith(".js"));
      for (const file of apiFiles) {
        const resource = path.basename(file, path.extname(file));
        const apiModule = await import(path.join(apiDir, file));
        const handlers: Record<string, ApiHandler> = apiModule.handlers ?? {};
        for (const [route, handler] of Object.entries(handlers)) {
          apiHandlers[`${resource}:${route}`] = handler;
        }
      }
    }

    // Load MCP tools
    let mcpTools: McpTool[] = [];
    const mcpToolsPath = path.join(modulePath, "mcp-tools.ts");
    const mcpToolsPathJs = path.join(modulePath, "mcp-tools.js");
    if (fs.existsSync(mcpToolsPath) || fs.existsSync(mcpToolsPathJs)) {
      const toolsModule = await import(
        fs.existsSync(mcpToolsPath) ? mcpToolsPath : mcpToolsPathJs
      );
      mcpTools = toolsModule.tools ?? [];
    }

    // Load events
    let events: EventDefinitions = { publishes: [], subscribers: {} };
    const eventsPath = path.join(modulePath, "events.ts");
    const eventsPathJs = path.join(modulePath, "events.js");
    if (fs.existsSync(eventsPath) || fs.existsSync(eventsPathJs)) {
      const eventsModule = await import(
        fs.existsSync(eventsPath) ? eventsPath : eventsPathJs
      );
      events = eventsModule.default ?? eventsModule;
    }

    // Build data layer mappings
    const dataLayerMappings: DataLayerMapping[] = [];
    if (manifest.dataLayer) {
      for (const [domainEvent, config] of Object.entries(manifest.dataLayer)) {
        dataLayerMappings.push({
          domainEvent,
          dataLayerEvent: config.event,
          params: config.params,
        });
      }
    }

    // Read AGENTS.md
    let agentsMd = "";
    const agentsMdPath = path.join(modulePath, "AGENTS.md");
    if (fs.existsSync(agentsMdPath)) {
      agentsMd = fs.readFileSync(agentsMdPath, "utf-8");
    }

    // Build module
    const cortexModule: CortexModule = {
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      enabled: manifest.enabled,
      dependencies: manifest.dependencies,
      path: modulePath,
      entities,
      apiHandlers,
      mcpTools,
      events,
      dataLayerMappings,
      agentsMd,
    };

    this.modules.set(manifest.id, cortexModule);
    console.log(`[Cortex] Loaded module: ${manifest.id} v${manifest.version}`);
  }

  // --- API Handler Resolution ---

  getApiHandler(
    moduleId: string,
    resource: string,
    method: string,
    subpath: string
  ): ApiHandler | null {
    const mod = this.modules.get(moduleId);
    if (!mod) return null;

    // Normalize subpath: strip leading/trailing slashes
    const normalizedSubpath = subpath.replace(/^\/+|\/+$/g, "");

    // Build the exact key to try first
    const exactKey = `${resource}:${method} /${normalizedSubpath}`;
    if (mod.apiHandlers[exactKey]) {
      return mod.apiHandlers[exactKey];
    }

    // Also try root route when subpath is empty
    if (normalizedSubpath === "") {
      const rootKey = `${resource}:${method} /`;
      if (mod.apiHandlers[rootKey]) {
        return mod.apiHandlers[rootKey];
      }
    }

    // Try parameterized matching
    const prefix = `${resource}:${method} `;
    for (const [key, handler] of Object.entries(mod.apiHandlers)) {
      if (!key.startsWith(prefix)) continue;

      const pattern = key.slice(prefix.length); // e.g., "/:id" or "/:id/publish"
      const params = matchRoute(pattern, `/${normalizedSubpath}`);
      if (params) {
        // Return a wrapper that injects extracted params
        return async (ctx: ApiContext) => {
          return handler({
            ...ctx,
            params: { ...ctx.params, ...params },
          });
        };
      }
    }

    return null;
  }

  // --- Accessors ---

  get(id: string): CortexModule | undefined {
    return this.modules.get(id);
  }

  getAll(): CortexModule[] {
    return Array.from(this.modules.values());
  }

  getAllMcpTools(): McpTool[] {
    const tools: McpTool[] = [];
    for (const mod of this.modules.values()) {
      tools.push(...mod.mcpTools);
    }
    return tools;
  }

  getAllEntities(): Record<string, unknown> {
    const entities: Record<string, unknown> = {};
    for (const mod of this.modules.values()) {
      for (const [name, entity] of Object.entries(mod.entities)) {
        entities[`${mod.id}.${name}`] = entity;
      }
    }
    return entities;
  }

  getAllDataLayerMappings(): DataLayerMapping[] {
    const mappings: DataLayerMapping[] = [];
    for (const mod of this.modules.values()) {
      mappings.push(...mod.dataLayerMappings);
    }
    return mappings;
  }
}

// --- Route Matching Utility ---

function matchRoute(
  pattern: string,
  actual: string
): Record<string, string> | null {
  // Split into segments, filtering empty strings
  const patternParts = pattern.split("/").filter(Boolean);
  const actualParts = actual.split("/").filter(Boolean);

  if (patternParts.length !== actualParts.length) return null;

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const pat = patternParts[i];
    const act = actualParts[i];

    if (pat.startsWith(":")) {
      // Parameter segment — extract the value
      params[pat.slice(1)] = act;
    } else if (pat !== act) {
      // Static segment mismatch
      return null;
    }
  }

  return params;
}

export const moduleRegistry = new ModuleRegistryImpl();
