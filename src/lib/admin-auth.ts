/**
 * Admin authentication guard for API routes.
 *
 * MVP: Bearer token check against CORTEX_ADMIN_SECRET env var.
 * Future: Replace with session-based auth, OAuth, or RBAC.
 *
 * Usage in route handler:
 *   const authError = requireAdmin(request);
 *   if (authError) return authError;
 */

import { NextResponse, type NextRequest } from "next/server";

const ADMIN_SECRET = process.env.CORTEX_ADMIN_SECRET;

/**
 * Checks if the request carries a valid admin token.
 * Returns null if authorized, or a 401/403 NextResponse if not.
 */
export function requireAdmin(request: NextRequest): NextResponse | null {
  // If no secret configured, block all admin access in production
  if (!ADMIN_SECRET) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "AUTH_NOT_CONFIGURED",
            message: "Admin authentication is not configured",
            aiHint:
              "Set CORTEX_ADMIN_SECRET environment variable to enable admin access",
          },
        },
        { status: 403 },
      );
    }
    // In development, allow unauthenticated admin access
    return null;
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or invalid Authorization header",
          aiHint: "Send Authorization: Bearer <CORTEX_ADMIN_SECRET>",
        },
      },
      { status: 401 },
    );
  }

  const token = authHeader.slice("Bearer ".length);
  if (token !== ADMIN_SECRET) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Invalid admin token",
          aiHint: "Check your CORTEX_ADMIN_SECRET value",
        },
      },
      { status: 403 },
    );
  }

  return null; // authorized
}
