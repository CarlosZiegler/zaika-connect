// scripts/setup-paradedb.ts
import { config } from "dotenv";
import { sql } from "drizzle-orm";

import { db } from "@/lib/db";

config();

async function setupParadeDB() {
  try {
    // Step 1: Enable pg_search extension
    console.log("Step 1: Setting up pg_search extension...");

    const extensionCheck = await db.execute(sql`
      SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'pg_search'
      ) as extension_exists;
    `);

    const result = extensionCheck.find((r) => r.extension_exists);
    if (result?.extension_exists) {
      console.log("  pg_search extension already enabled");
    } else {
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_search;`);
      console.log("  pg_search extension enabled");
    }

    // Step 2: Create BM25 indexes
    console.log("\nStep 2: Creating BM25 indexes...");

    // Jobs: search title + description
    console.log("  Creating jobs_bm25_idx...");
    await db.execute(sql`DROP INDEX IF EXISTS jobs_bm25_idx;`);
    await db.execute(sql`
      CREATE INDEX jobs_bm25_idx ON jobs
      USING bm25 (id, title, description)
      WITH (key_field='id');
    `);

    // CVs: search full text
    console.log("  Creating cvs_bm25_idx...");
    await db.execute(sql`DROP INDEX IF EXISTS cvs_bm25_idx;`);
    await db.execute(sql`
      CREATE INDEX cvs_bm25_idx ON cvs
      USING bm25 (id, cv_text)
      WITH (key_field='id');
    `);

    // Candidates: search by name/email
    console.log("  Creating candidates_bm25_idx...");
    await db.execute(sql`DROP INDEX IF EXISTS candidates_bm25_idx;`);
    await db.execute(sql`
      CREATE INDEX candidates_bm25_idx ON candidates
      USING bm25 (id, full_name, email)
      WITH (key_field='id');
    `);

    console.log("\nParadeDB setup complete!");
    console.log("  - pg_search extension: enabled");
    console.log("  - jobs_bm25_idx: created");
    console.log("  - cvs_bm25_idx: created");
    console.log("  - candidates_bm25_idx: created");
  } catch (error) {
    console.error("Failed to setup ParadeDB:", error);
    process.exit(1);
  }
}

setupParadeDB().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
