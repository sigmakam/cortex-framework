export async function register() {
  // Intentionally minimal — heavy initialization happens lazily in API routes
  // to avoid webpack bundling issues with Node.js-only packages (postgres, etc.)
  console.log("[Cortex] Instrumentation registered");
}
