import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// Singleton pool for dev (prevents too many connections with hot reload)
const globalForDb = globalThis as unknown as {
    pool: mysql.Pool | undefined;
};

const isProduction = process.env.NODE_ENV === "production";

const dbUrl = process.env.DATABASE_URL ?? "";
const isTiDB = dbUrl.includes("tidbcloud.com");

const pool = globalForDb.pool ?? mysql.createPool({
    uri: dbUrl,
    waitForConnections: true,
    connectionLimit: isProduction ? 5 : 10,
    charset: "utf8mb4",
    timezone: "+00:00",
    ssl: isTiDB ? { rejectUnauthorized: true } : undefined,
});

if (!isProduction) globalForDb.pool = pool;

export const db = drizzle(pool, { schema, mode: "planetscale" });

// Re-export schema for convenience
export * from "./schema";
