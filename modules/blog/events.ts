import type { DomainEvent } from "@/core/types";

export const events = {
  publishes: [
    "post.created",
    "post.published",
    "post.updated",
    "post.deleted",
    "comment.created",
    "comment.approved",
  ],
  subscribers: {} as Record<string, (event: DomainEvent) => Promise<void>>,
};
