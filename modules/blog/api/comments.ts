import { db } from "@/lib/db";
import { comments } from "../entities/comment";
import { eq, desc, and, sql } from "drizzle-orm";
import { eventBus } from "@/core/event-bus";
import type { ApiHandler, ToolResponse } from "@/core/types";

const listComments: ApiHandler = async (ctx) => {
  const start = Date.now();
  const { postId, status, page = "1", perPage = "10" } = ctx.searchParams;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const perPageNum = Math.max(1, Math.min(100, parseInt(perPage, 10) || 10));
  const offset = (pageNum - 1) * perPageNum;

  const conditions = [];
  if (postId) conditions.push(eq(comments.postId, postId));
  if (status) conditions.push(eq(comments.status, status));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(comments)
      .where(where)
      .orderBy(desc(comments.createdAt))
      .limit(perPageNum)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(comments)
      .where(where),
  ]);

  return {
    success: true,
    data: rows,
    metadata: {
      total: countResult[0]?.count ?? 0,
      page: pageNum,
      perPage: perPageNum,
      executionTimeMs: Date.now() - start,
    },
  };
};

const createComment: ApiHandler = async (ctx) => {
  const start = Date.now();
  const body = ctx.body as {
    postId?: string;
    authorName?: string;
    authorEmail?: string;
    content?: string;
    parentId?: string;
  } | undefined;

  const missing = [];
  if (!body?.postId) missing.push("postId");
  if (!body?.authorName) missing.push("authorName");
  if (!body?.authorEmail) missing.push("authorEmail");
  if (!body?.content) missing.push("content");

  if (missing.length > 0) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: `Missing required fields: ${missing.join(", ")}`,
        aiHint: `Provide all required fields: postId, authorName, authorEmail, content`,
      },
    };
  }

  const [comment] = await db
    .insert(comments)
    .values({
      postId: body!.postId!,
      authorName: body!.authorName!,
      authorEmail: body!.authorEmail!,
      content: body!.content!,
      parentId: body!.parentId ?? null,
    })
    .returning();

  await eventBus.publish({
    type: "comment.created",
    module: "blog",
    payload: {
      post_id: comment.postId,
      comment_id: comment.id,
      comment_length: comment.content.length,
    },
  });

  return {
    success: true,
    data: comment,
    metadata: { executionTimeMs: Date.now() - start },
  };
};

const getComment: ApiHandler = async (ctx) => {
  const start = Date.now();
  const { id } = ctx.params;

  const [comment] = await db.select().from(comments).where(eq(comments.id, id)).limit(1);

  if (!comment) {
    return {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Comment with id '${id}' not found`,
        aiHint: "Check the comment ID and try again",
      },
    };
  }

  return {
    success: true,
    data: comment,
    metadata: { executionTimeMs: Date.now() - start },
  };
};

const updateComment: ApiHandler = async (ctx) => {
  const start = Date.now();
  const { id } = ctx.params;
  const body = ctx.body as Partial<{
    content: string;
    status: string;
  }> | undefined;

  if (!body || Object.keys(body).length === 0) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request body must contain at least one field to update",
        aiHint: "Provide 'content' or 'status' to update",
      },
    };
  }

  const [updated] = await db
    .update(comments)
    .set(body)
    .where(eq(comments.id, id))
    .returning();

  if (!updated) {
    return {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Comment with id '${id}' not found`,
        aiHint: "Check the comment ID and try again",
      },
    };
  }

  // Publish approval event if status changed to approved
  if (body.status === "approved") {
    await eventBus.publish({
      type: "comment.approved",
      module: "blog",
      payload: {
        comment_id: updated.id,
        post_id: updated.postId,
      },
    });
  }

  return {
    success: true,
    data: updated,
    metadata: { executionTimeMs: Date.now() - start },
  };
};

const deleteComment: ApiHandler = async (ctx) => {
  const start = Date.now();
  const { id } = ctx.params;

  const [deleted] = await db.delete(comments).where(eq(comments.id, id)).returning();

  if (!deleted) {
    return {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Comment with id '${id}' not found`,
        aiHint: "Check the comment ID and try again",
      },
    };
  }

  return {
    success: true,
    data: { id: deleted.id, deleted: true },
    metadata: { executionTimeMs: Date.now() - start },
  };
};

export const handlers: Record<string, ApiHandler> = {
  "GET /": listComments,
  "POST /": createComment,
  "GET /:id": getComment,
  "PUT /:id": updateComment,
  "DELETE /:id": deleteComment,
};
