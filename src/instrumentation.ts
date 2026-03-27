export async function register() {
  if (typeof window !== "undefined") return;

  const { moduleRegistry } = await import("@/core/module-registry");
  await moduleRegistry.discoverModules();

  console.log("[Cortex] Framework initialized");
}
