import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: ["./src/lib/schema.ts", "./modules/*/entities/*.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://cortex:cortex@localhost:5432/cortex",
  },
});
