import { NextRequest, NextResponse } from "next/server";
import { moduleRegistry } from "@/core/module-registry";
import { ensureInitialized } from "@/core/init";

async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  await ensureInitialized();
  const start = Date.now();

  const { path: pathSegments } = await params;

  if (!pathSegments || pathSegments.length < 2) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "API path must include at least moduleId and resource (e.g., /api/modules/blog/posts)",
          aiHint: "Use the format /api/modules/{moduleId}/{resource}[/{subpath}]",
        },
      },
      { status: 400 }
    );
  }

  const moduleId = pathSegments[0];
  const resource = pathSegments[1];
  const subpath = pathSegments.slice(2).join("/");
  const method = request.method;

  // Resolve handler
  const handler = moduleRegistry.getApiHandler(moduleId, resource, method, subpath);

  if (!handler) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `No handler found for ${method} /api/modules/${pathSegments.join("/")}`,
          aiHint: `Check that module '${moduleId}' exists and has a '${resource}' resource with a matching route`,
        },
      },
      { status: 404 }
    );
  }

  // Parse search params
  const searchParams: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    searchParams[key] = value;
  });

  // Parse body for mutating methods
  let body: unknown = undefined;
  if (["POST", "PUT", "PATCH"].includes(method)) {
    try {
      body = await request.json();
    } catch {
      // Body may be empty or not JSON — that's OK, handler will validate
    }
  }

  try {
    const result = await handler({
      params: {},
      searchParams,
      body,
    });

    // Add execution time to metadata
    const executionTimeMs = Date.now() - start;
    if (result.metadata) {
      result.metadata.executionTimeMs = executionTimeMs;
    } else {
      result.metadata = { executionTimeMs };
    }

    // Determine status code
    let status = 200;
    if (!result.success && result.error) {
      if (result.error.code === "NOT_FOUND") {
        status = 404;
      } else {
        status = 400;
      }
    } else if (method === "POST" && result.success && !result.error) {
      status = 201;
    }

    return NextResponse.json(result, { status });
  } catch (err) {
    const executionTimeMs = Date.now() - start;
    console.error(`[Cortex API] Error in ${method} /api/modules/${pathSegments.join("/")}:`, err);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: err instanceof Error ? err.message : "An unexpected error occurred",
          aiHint: "This is a server-side error. Check the server logs for details.",
        },
        metadata: { executionTimeMs },
      },
      { status: 500 }
    );
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
export const PATCH = handleRequest;
