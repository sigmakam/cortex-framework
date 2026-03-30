import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default("postgresql://cortex:cortex@localhost:5432/cortex"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  NEXT_PUBLIC_GTM_ID: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  CORTEX_ADMIN_SECRET: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = envSchema.parse(process.env);
