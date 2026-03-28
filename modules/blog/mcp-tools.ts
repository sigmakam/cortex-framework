import { z } from "zod";
import { db } from "@/lib/db";
import { posts } from "./entities/post";
import { eq, ilike, or, desc } from "drizzle-orm";
import { eventBus } from "@/core/event-bus";
import type { McpTool, ToolResponse } from "@/core/types";

const publishPost: McpTool = {
  name: "publish_post",
  description:
    "Publish a draft blog post by setting its status to 'published' and recording the publish timestamp",
  inputSchema: {
    postId: z.string().describe("The post ID to publish"),
  },
  handler: async (input: Record<string, unknown>): Promise<ToolResponse> => {
    const postId = input.postId as string;

    if (!postId) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "postId is required",
          aiHint: "Provide a valid UUID for the post you want to publish",
        },
      };
    }

    const [updated] = await db
      .update(posts)
      .set({
        status: "published",
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId))
      .returning();

    if (!updated) {
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Post with id '${postId}' not found`,
          aiHint: "Use list_posts to find available post IDs",
        },
      };
    }

    await eventBus.publish({
      type: "post.published",
      module: "blog",
      payload: {
        post_id: updated.id,
        post_title: updated.title,
        author: updated.author,
        tags: updated.tags,
      },
    });

    return {
      success: true,
      data: updated,
    };
  },
};

const searchPosts: McpTool = {
  name: "search_posts",
  description:
    "Full-text search across blog post titles and content using case-insensitive matching",
  inputSchema: {
    query: z.string().describe("Search query to match against title and content"),
    limit: z.number().optional().describe("Maximum results to return (default 10)"),
  },
  handler: async (input: Record<string, unknown>): Promise<ToolResponse> => {
    const query = input.query as string;
    const limit = (input.limit as number) ?? 10;

    if (!query) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "query is required",
          aiHint: "Provide a search string to match against post titles and content",
        },
      };
    }

    const pattern = `%${query}%`;

    const results = await db
      .select()
      .from(posts)
      .where(or(ilike(posts.title, pattern), ilike(posts.content, pattern)))
      .orderBy(desc(posts.createdAt))
      .limit(limit);

    return {
      success: true,
      data: results,
      metadata: {
        total: results.length,
      },
    };
  },
};

export const tools: McpTool[] = [publishPost, searchPosts];
