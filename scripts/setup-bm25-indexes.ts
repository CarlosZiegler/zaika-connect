// scripts/setup-bm25-indexes.ts
import { config } from "dotenv";
import { sql } from "drizzle-orm";

import { db } from "@/lib/db";

config();

async function setupBm25Indexes() {
  try {
    console.log("Setting up BM25 indexes...");

    // Jobs: search title + description
    console.log("Creating jobs_bm25_idx...");
    await db.execute(sql`
      DROP INDEX IF EXISTS jobs_bm25_idx;
    `);
    await db.execute(sql`
      CREATE INDEX jobs_bm25_idx ON jobs
      USING bm25 (id, title, description)
      WITH (key_field='id');
    `);

    // CVs: search full text
    console.log("Creating cvs_bm25_idx...");
    await db.execute(sql`
      DROP INDEX IF EXISTS cvs_bm25_idx;
    `);
    await db.execute(sql`
      CREATE INDEX cvs_bm25_idx ON cvs
      USING bm25 (id, cv_text)
      WITH (key_field='id');
    `);

    // Candidates: search by name/email
    console.log("Creating candidates_bm25_idx...");
    await db.execute(sql`
      DROP INDEX IF EXISTS candidates_bm25_idx;
    `);
    await db.execute(sql`
      CREATE INDEX candidates_bm25_idx ON candidates
      USING bm25 (id, full_name, email)
      WITH (key_field='id');
    `);

    console.log("All BM25 indexes created successfully!");
  } catch (error) {
    console.error("Failed to setup BM25 indexes:", error);
    process.exit(1);
  }
}

setupBm25Indexes().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
