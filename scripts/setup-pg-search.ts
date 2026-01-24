// scripts/setup-pg-search.ts
import { config } from "dotenv";
import { sql } from "drizzle-orm";

import { db } from "@/lib/db";

config();

async function setupPgSearch() {
  try {
    console.log("Setting up pg_search extension...");

    const extensionCheck = await db.execute(sql`
      SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'pg_search'
      ) as extension_exists;
    `);

    const result = extensionCheck.find((r) => r.extension_exists);
    if (result?.extension_exists) {
      console.log("pg_search extension is already enabled!");
      return;
    }

    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_search;`);

    console.log("pg_search extension has been successfully enabled!");
  } catch (error) {
    console.error("Failed to setup pg_search extension:", error);
    process.exit(1);
  }
}

setupPgSearch().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
