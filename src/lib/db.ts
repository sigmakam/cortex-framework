import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "postgresql://cortex:cortex@localhost:5432/cortex";

const client = postgres(connectionString);
export const db = drizzle(client);
