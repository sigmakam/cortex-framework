import { NextResponse, type NextRequest } from "next/server";
import { siteConfigService } from "@/core/site-config";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/config — get full site config
 * GET /api/admin/config?key=company.name — get a single value
 */
export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  const key = request.nextUrl.searchParams.get("key");

  if (key) {
    const value = await siteConfigService.get(key);
    return NextResponse.json({
      success: true,
      data: { key, value: value ?? null },
    });
  }

  const all = await siteConfigService.loadAll();
  const data: Record<string, unknown> = {};
  for (const [k, v] of all) {
    data[k] = v;
  }
  return NextResponse.json({ success: true, data });
}

/**
 * PUT /api/admin/config — upsert config value(s)
 * Body: { "company.name": "Nowa Firma", "analytics.gtmId": "GTM-XXXX" }
 */
export async function PUT(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const body = await request.json();

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_BODY",
          message: "Body must be a JSON object of key-value pairs",
          aiHint: 'Send { "company.name": "value" }',
        },
      },
      { status: 400 },
    );
  }

  const updated: string[] = [];
  for (const [key, value] of Object.entries(body)) {
    await siteConfigService.set(key, value);
    updated.push(key);
  }

  return NextResponse.json({
    success: true,
    data: { updated },
  });
}
