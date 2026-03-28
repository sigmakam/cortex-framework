import { moduleRegistry } from "./module-registry";
import { themeRegistry } from "./theme-registry";
import { dataLayerService } from "./data-layer";

let initialized = false;

export async function ensureInitialized() {
  if (initialized) return;
  initialized = true;

  // Load blog module
  const blogManifest = await import("@modules/blog/module.json");
  const postEntity = await import("@modules/blog/entities/post");
  const commentEntity = await import("@modules/blog/entities/comment");
  const postsApi = await import("@modules/blog/api/posts");
  const commentsApi = await import("@modules/blog/api/comments");
  const blogEvents = await import("@modules/blog/events");

  let mcpTools: any[] = [];
  try {
    const mcpModule = await import("@modules/blog/mcp-tools");
    mcpTools = mcpModule.tools ?? [];
  } catch {
    // mcp-tools may not exist
  }

  const apiHandlers: Record<string, any> = {};
  for (const [route, handler] of Object.entries(postsApi.handlers)) {
    apiHandlers[`posts:${route}`] = handler;
  }
  for (const [route, handler] of Object.entries(commentsApi.handlers)) {
    apiHandlers[`comments:${route}`] = handler;
  }

  const dataLayerMappings: any[] = [];
  const manifest = blogManifest.default ?? blogManifest;
  if (manifest.dataLayer) {
    for (const [domainEvent, config] of Object.entries(manifest.dataLayer as Record<string, any>)) {
      dataLayerMappings.push({
        domainEvent,
        dataLayerEvent: config.event,
        params: config.params,
      });
    }
  }

  moduleRegistry.registerModule({
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    enabled: manifest.enabled,
    dependencies: manifest.dependencies ?? [],
    path: "modules/blog",
    entities: { post: postEntity, comment: commentEntity },
    apiHandlers,
    mcpTools,
    events: blogEvents.events ?? { publishes: [], subscribers: {} },
    dataLayerMappings,
    agentsMd: "",
  });

  // Load default theme
  const defaultThemeConfig = await import("@themes/default/theme.json");
  themeRegistry.registerTheme(defaultThemeConfig.default ?? defaultThemeConfig, "themes/default");

  // Initialize data layer
  dataLayerService.init();

  console.log(`[Cortex] Initialized: ${moduleRegistry.getAll().length} module(s), ${themeRegistry.getAll().length} theme(s)`);
}
