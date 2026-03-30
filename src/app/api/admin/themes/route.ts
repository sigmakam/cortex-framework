import { NextResponse, type NextRequest } from "next/server";
import { themeService } from "@/core/theme-service";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/themes — list all themes with active status
 */
export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const allThemes = await themeService.getAll();
  return NextResponse.json({ success: true, data: allThemes });
}
