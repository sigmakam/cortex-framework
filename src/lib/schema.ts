import { pgTable, uuid, text, jsonb, timestamp, boolean, integer, unique } from "drizzle-orm/pg-core";

// --- Domain Events ---

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),
  module: text("module").notNull(),
  payload: jsonb("payload").notNull().$type<Record<string, unknown>>(),
  correlationId: text("correlation_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Site Config (key-value store, replaces cortex.site.config.ts) ---

export const siteConfig = pgTable("site_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull().$type<unknown>(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Themes (runtime-switchable, stored in DB) ---

export const themes = pgTable("themes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  version: text("version").notNull().default("1.0.0"),
  description: text("description"),
  author: text("author"),
  tokens: jsonb("tokens").notNull().$type<Record<string, unknown>>(),
  components: jsonb("components").notNull().$type<Record<string, string>>(),
  layouts: jsonb("layouts").notNull().$type<Record<string, string>>(),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Site Content (page texts stored in DB, theme-independent) ---

export const siteContent = pgTable(
  "site_content",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    page: text("page").notNull(),
    section: text("section").notNull(),
    slot: text("slot").notNull(),
    content: text("content").notNull(),
    locale: text("locale").notNull().default("pl_PL"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("site_content_unique").on(table.page, table.section, table.slot, table.locale),
  ],
);
