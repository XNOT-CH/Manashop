import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

const rawUrl = process.env.DATABASE_URL || "mysql://root:@localhost:3306/my_game_store";

export default defineConfig({
    schema: "./lib/db/schema.ts",
    out: "./drizzle",
    dialect: "mysql",
    dbCredentials: {
        url: rawUrl,
    },
});
