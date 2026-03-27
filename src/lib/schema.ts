import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),
  module: text("module").notNull(),
  payload: jsonb("payload").notNull().$type<Record<string, unknown>>(),
  correlationId: text("correlation_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
