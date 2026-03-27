import { db } from "@/lib/db";
import { posts } from "../entities/post";
import { eq, ilike, desc, and, sql } from "drizzle-orm";
import { eventBus } from "@/core/event-bus";
import type { ApiHandler, ToolResponse } from "@/core/types";

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Date.now().toString(36);
  return `${base}-${suffix}`;
}

const listPosts: ApiHandler = async (ctx) => {
  const start = Date.now();
  const { status, tag, search, page = "1", perPage = "10" } = ctx.searchParams;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const perPageNum = Math.max(1, Math.min(100, parseInt(perPage, 10) || 10));
  const offset = (pageNum - 1) * perPageNum;

  const conditions = [];
  if (status) conditions.push(eq(posts.status, status));
  if (search) conditions.push(ilike(posts.title, `%${search}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [allRows, countResult] = await Promise.all([
    db
      .select()
      .from(posts)
      .where(where)
      .orderBy(desc(posts.createdAt))
      .limit(perPageNum)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(where),
  ]);

  // Tag filter in application layer (jsonb array)
  let filtered = allRows;
  if (tag) {
    filtered = allRows.filter((row) => row.tags.includes(tag));
  }

  return {
    success: true,
    data: filtered,
    metadata: {
      total: countResult[0]?.count ?? 0,
      page: pageNum,
      perPage: perPageNum,
      executionTimeMs: Date.now() - start,
    },
  };
};

const createPost: ApiHandler = async (ctx) => {
  const start = Date.now();
  const body = ctx.body as {
    title?: string;
    content?: string;
    excerpt?: string;
    author?: string;
    tags?: string[];
    status?: string;
  } | undefined;

  if (!body?.title) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Title is required",
        aiHint: "Provide a 'title' field in the request body",
      },
    };
  }

  const slug = slugify(body.title);
  const content = body.content ?? "";
  const excerpt = body.excerpt ?? (content.length > 0 ? content.slice(0, 200) : undefined);

  const [post] = await db
    .insert(posts)
    .values({
      title: body.title,
      slug,
      content,
      excerpt,
      author: body.author ?? "Anonymous",
      tags: body.tags ?? [],
      status: body.status ?? "draft",
    })
    .returning();

  await eventBus.publish({
    type: "post.created",
    module: "blog",
    payload: {
      post_id: post.id,
      post_title: post.title,
      author: post.author,
    },
  });

  return {
    success: true,
    data: post,
    metadata: { executionTimeMs: Date.now() - start },
  };
};

const getPost: ApiHandler = async (ctx) => {
  const start = Date.now();
  const { id } = ctx.params;

  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);

  if (!post) {
    return {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Post with id '${id}' not found`,
        aiHint: "Check the post ID and try again",
      },
    };
  }

  return {
    success: true,
    data: post,
    metadata: { executionTimeMs: Date.now() - start },
  };
};

const updatePost: ApiHandler = async (ctx) => {
  const start = Date.now();
  const { id } = ctx.params;
  const body = ctx.body as Partial<{
    title: string;
    content: string;
    excerpt: string;
    author: string;
    tags: string[];
    status: string;
    metadata: Record<string, unknown>;
  }> | undefined;

  if (!body || Object.keys(body).length === 0) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request body must contain at least one field to update",
        aiHint: "Provide fields like title, content, excerpt, author, tags, or status",
      },
    };
  }

  const updateData: Record<string, unknown> = { ...body, updatedAt: new Date() };

  // Re-generate slug if title changes
  if (body.title) {
    updateData.slug = slugify(body.title);
  }

  const [updated] = await db
    .update(posts)
    .set(updateData)
    .where(eq(posts.id, id))
    .returning();

  if (!updated) {
    return {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Post with id '${id}' not found`,
        aiHint: "Check the post ID and try again",
      },
    };
  }

  await eventBus.publish({
    type: "post.updated",
    module: "blog",
    payload: {
      post_id: updated.id,
      post_title: updated.title,
      author: updated.author,
      changes: Object.keys(body),
    },
  });

  return {
    success: true,
    data: updated,
    metadata: { executionTimeMs: Date.now() - start },
  };
};

const deletePost: ApiHandler = async (ctx) => {
  const start = Date.now();
  const { id } = ctx.params;

  const [deleted] = await db.delete(posts).where(eq(posts.id, id)).returning();

  if (!deleted) {
    return {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Post with id '${id}' not found`,
        aiHint: "Check the post ID and try again",
      },
    };
  }

  await eventBus.publish({
    type: "post.deleted",
    module: "blog",
    payload: {
      post_id: deleted.id,
      post_title: deleted.title,
    },
  });

  return {
    success: true,
    data: { id: deleted.id, deleted: true },
    metadata: { executionTimeMs: Date.now() - start },
  };
};

const publishPost: ApiHandler = async (ctx) => {
  const start = Date.now();
  const { id } = ctx.params;

  const [published] = await db
    .update(posts)
    .set({
      status: "published",
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id))
    .returning();

  if (!published) {
    return {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Post with id '${id}' not found`,
        aiHint: "Check the post ID and try again",
      },
    };
  }

  await eventBus.publish({
    type: "post.published",
    module: "blog",
    payload: {
      post_id: published.id,
      post_title: published.title,
      author: published.author,
      tags: published.tags,
    },
  });

  return {
    success: true,
    data: published,
    metadata: { executionTimeMs: Date.now() - start },
  };
};

export const handlers: Record<string, ApiHandler> = {
  "GET /": listPosts,
  "POST /": createPost,
  "GET /:id": getPost,
  "PUT /:id": updatePost,
  "DELETE /:id": deletePost,
  "POST /:id/publish": publishPost,
};
