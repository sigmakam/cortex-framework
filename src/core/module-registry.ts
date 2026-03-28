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

  /** Register a fully-loaded module */
  registerModule(module: CortexModule): void {
    this.modules.set(module.id, module);
    console.log(`[Cortex] Loaded module: ${module.id} v${module.version}`);
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

    const normalizedSubpath = subpath.replace(/^\/+|\/+$/g, "");

    // Try exact match
    const exactKey = `${resource}:${method} /${normalizedSubpath}`;
    if (mod.apiHandlers[exactKey]) {
      return mod.apiHandlers[exactKey];
    }

    // Try root route
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

      const pattern = key.slice(prefix.length);
      const params = matchRoute(pattern, `/${normalizedSubpath}`);
      if (params) {
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

function matchRoute(
  pattern: string,
  actual: string
): Record<string, string> | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const actualParts = actual.split("/").filter(Boolean);

  if (patternParts.length !== actualParts.length) return null;

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const pat = patternParts[i];
    const act = actualParts[i];

    if (pat.startsWith(":")) {
      params[pat.slice(1)] = act;
    } else if (pat !== act) {
      return null;
    }
  }

  return params;
}

export const moduleRegistry = new ModuleRegistryImpl();
