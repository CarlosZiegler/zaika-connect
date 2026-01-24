// src/lib/search/cv-search.ts
import { sql } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";

import { candidates, cvs } from "@/lib/db/schema";

import { generateCvEmbedding } from "../cv/cv-embeddings";

type HybridSearchParams = {
  query: string;
  limit?: number;
};

export async function hybridCvSearch(
  db: PgDatabase<any, any, any>,
  params: HybridSearchParams
) {
  const { query, limit = 20 } = params;

  // Generate embedding for semantic search
  const queryEmbedding = await generateCvEmbedding(query);
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  // Hybrid search with Reciprocal Rank Fusion (BM25 + Vector)
  const results = await db.execute(sql`
    WITH bm25_results AS (
      SELECT id, paradedb.score(id) as bm25_score
      FROM cvs
      WHERE cv_text @@@ ${query}
    ),
    vector_results AS (
      SELECT id, 1 - (cv_embedding <=> ${embeddingStr}::vector) as vector_score
      FROM cvs
      WHERE cv_embedding IS NOT NULL
      ORDER BY cv_embedding <=> ${embeddingStr}::vector
      LIMIT 100
    ),
    bm25_ranked AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY bm25_score DESC) as rank
      FROM bm25_results
    ),
    vector_ranked AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY vector_score DESC) as rank
      FROM vector_results
    )
    SELECT
      c.id,
      c.candidate_id as "candidateId",
      c.file_id as "fileId",
      c.file_key as "fileKey",
      c.cv_text as "cvText",
      c.ai_score as "aiScore",
      c.ai_analysis as "aiAnalysis",
      c.processing_status as "processingStatus",
      c.processing_error as "processingError",
      c.processed_at as "processedAt",
      c.created_at as "createdAt",
      cand.email as candidate_email,
      cand.full_name as candidate_name,
      cand.phone as candidate_phone,
      COALESCE(1.0 / (60 + bm25.rank), 0) +
      COALESCE(1.0 / (60 + vec.rank), 0) as rrf_score
    FROM cvs c
    JOIN candidates cand ON c.candidate_id = cand.id
    LEFT JOIN bm25_ranked bm25 ON c.id = bm25.id
    LEFT JOIN vector_ranked vec ON c.id = vec.id
    WHERE bm25.id IS NOT NULL OR vec.id IS NOT NULL
    ORDER BY rrf_score DESC
    LIMIT ${limit}
  `);

  return results as Array<
    typeof cvs.$inferSelect & {
      candidate_email: string;
      candidate_name: string;
      candidate_phone: string | null;
      rrf_score: number;
    }
  >;
}

export async function searchCandidates(
  db: PgDatabase<any, any, any>,
  query: string,
  limit = 20
) {
  // BM25 full-text search on candidates
  const results = await db.execute(sql`
    SELECT
      id,
      email,
      full_name as "fullName",
      phone,
      created_at as "createdAt",
      updated_at as "updatedAt",
      paradedb.score(id) as rank
    FROM candidates
    WHERE full_name @@@ ${query} OR email @@@ ${query}
    ORDER BY rank DESC
    LIMIT ${limit}
  `);

  return results as Array<typeof candidates.$inferSelect & { rank: number }>;
}
