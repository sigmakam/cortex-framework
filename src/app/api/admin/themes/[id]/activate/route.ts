import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { themeService } from "@/core/theme-service";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * POST /api/admin/themes/:id/activate — activate a theme
 *
 * Deactivates all themes, activates the target.
 * Revalidates all pages so the new theme takes effect immediately.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  const success = await themeService.activate(id);

  if (!success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "THEME_NOT_FOUND",
          message: `Theme '${id}' not found`,
          aiHint: "Check available themes with GET /api/admin/themes",
        },
      },
      { status: 404 },
    );
  }

  // Revalidate all pages so new theme CSS takes effect
  revalidatePath("/", "layout");

  return NextResponse.json({
    success: true,
    data: { activatedTheme: id },
  });
}
