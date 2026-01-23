import { config } from "dotenv";
import { sql } from "drizzle-orm";

import { db } from "@/lib/db";

// Load environment variables
config();

async function setupVectorExtension() {
  try {
    console.log("🚀 Setting up vector extension...");

    // Check if vector extension is already enabled
    const extensionCheck = await db.execute(sql`
      SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) as extension_exists;
    `);

    const result = extensionCheck.find((r) => r.extension_exists);
    if (result?.extension_exists) {
      console.log("✅ Vector extension is already enabled!");
      return;
    }

    // Enable vector extension
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);

    console.log("✅ Vector extension has been successfully enabled!");
    console.log(
      "📝 Your database is now ready for vector operations and embeddings."
    );
  } catch (error) {
    console.error("❌ Failed to setup vector extension:", error);
    process.exit(1);
  }
}

const main = async () => {
  await setupVectorExtension();
};

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
