import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { moduleRegistry } from "@/core/module-registry";
import { ensureInitialized } from "@/core/init";

export async function GET() {
  await ensureInitialized();
  const checks: Record<string, { status: string; latency?: string }> = {};

  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    checks.database = { status: "ok", latency: `${Date.now() - start}ms` };
  } catch {
    checks.database = { status: "error" };
  }

  const modules = moduleRegistry.getAll();
  checks.modules = { status: "ok", latency: `${modules.length} loaded` };

  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json({
    status: allOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    checks,
  });
}
