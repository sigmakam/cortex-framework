export async function register() {
  if (typeof window !== "undefined") return;

  const { moduleRegistry } = await import("@/core/module-registry");
  const { themeRegistry } = await import("@/core/theme-registry");
  const { dataLayerService } = await import("@/core/data-layer");

  await moduleRegistry.discoverModules();
  themeRegistry.discoverThemes();
  dataLayerService.init();

  console.log("[Cortex] Framework initialized");
}
