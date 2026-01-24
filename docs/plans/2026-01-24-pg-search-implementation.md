# pg_search Hybrid Search Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace ILIKE with BM25 search for jobs and add hybrid search (BM25 + vector) for CV/candidate matching.

**Architecture:** New `candidates` and `cvs` tables separate concerns from `applications`. pg_search provides BM25 indexing. CV upload triggers AI extraction for text + embedding. Hybrid search uses Reciprocal Rank Fusion to combine BM25 and vector scores.

**Tech Stack:** pg_search (ParadeDB), pgvector, Drizzle ORM, OpenAI embeddings (text-embedding-3-small), AI SDK

---

## Task 1: Enable pg_search Extension

**Files:**
- Create: `scripts/setup-pg-search.ts`
- Modify: `package.json`

**Step 1: Create extension setup script**

```typescript
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
```

**Step 2: Add script to package.json**

In `package.json` scripts section, add:
```json
"db:pg-search": "bun run scripts/setup-pg-search.ts"
```

**Step 3: Run the script**

Run: `bun run db:pg-search`
Expected: "pg_search extension has been successfully enabled!"

**Step 4: Commit**

```bash
git add scripts/setup-pg-search.ts package.json
git commit -m "feat: add pg_search extension setup script"
```

---

## Task 2: Create Candidates Table Schema

**Files:**
- Modify: `src/lib/db/schema/recruiting.ts`

**Step 1: Add candidates table after CVAnalysis type**

Add after line 27 (after CVAnalysis type):

```typescript
export const candidates = pgTable("candidates", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
```

**Step 2: Generate and push schema**

Run: `bun run db:generate && bun run db:push`
Expected: Migration generated and applied successfully

**Step 3: Commit**

```bash
git add src/lib/db/schema/recruiting.ts
git commit -m "feat: add candidates table schema"
```

---

## Task 3: Create CVs Table Schema

**Files:**
- Modify: `src/lib/db/schema/recruiting.ts`

**Step 1: Import vector type**

Add to imports at top of file:
```typescript
import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  vector,
} from "drizzle-orm/pg-core";
```

**Step 2: Add cvs table after candidates**

```typescript
export const cvs = pgTable(
  "cvs",
  {
    id: text("id").primaryKey(),
    candidateId: text("candidate_id")
      .references(() => candidates.id, { onDelete: "cascade" })
      .notNull(),
    fileId: text("file_id").references(() => file.id),
    fileKey: text("file_key"),
    cvText: text("cv_text"),
    cvEmbedding: vector("cv_embedding", { dimensions: 1536 }),
    aiScore: integer("ai_score"),
    aiAnalysis: json("ai_analysis").$type<CVAnalysis>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("cvs_embedding_idx").using(
      "hnsw",
      table.cvEmbedding.op("vector_cosine_ops")
    ),
  ]
);
```

**Step 3: Generate and push schema**

Run: `bun run db:generate && bun run db:push`
Expected: Migration generated and applied successfully

**Step 4: Commit**

```bash
git add src/lib/db/schema/recruiting.ts
git commit -m "feat: add cvs table schema with vector index"
```

---

## Task 4: Update Applications Table

**Files:**
- Modify: `src/lib/db/schema/recruiting.ts`

**Step 1: Replace applications table**

Replace the existing applications table with:

```typescript
export const applications = pgTable("applications", {
  id: text("id").primaryKey(),
  jobId: text("job_id")
    .references(() => jobs.id, { onDelete: "cascade" })
    .notNull(),
  candidateId: text("candidate_id")
    .references(() => candidates.id, { onDelete: "cascade" })
    .notNull(),
  cvId: text("cv_id")
    .references(() => cvs.id)
    .notNull(),
  message: text("message"),
  status: text("status").default("new").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Step 2: Update relations**

Replace existing relations with:

```typescript
export const candidatesRelations = relations(candidates, ({ many }) => ({
  cvs: many(cvs),
  applications: many(applications),
}));

export const cvsRelations = relations(cvs, ({ one, many }) => ({
  candidate: one(candidates, {
    fields: [cvs.candidateId],
    references: [candidates.id],
  }),
  file: one(file, {
    fields: [cvs.fileId],
    references: [file.id],
  }),
  applications: many(applications),
}));

export const jobsRelations = relations(jobs, ({ many }) => ({
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
  candidate: one(candidates, {
    fields: [applications.candidateId],
    references: [candidates.id],
  }),
  cv: one(cvs, {
    fields: [applications.cvId],
    references: [cvs.id],
  }),
}));
```

**Step 3: Generate and push schema**

Run: `bun run db:generate && bun run db:push`
Expected: Migration generated and applied successfully

**Step 4: Commit**

```bash
git add src/lib/db/schema/recruiting.ts
git commit -m "feat: update applications to reference candidates and cvs"
```

---

## Task 5: Create BM25 Indexes Script

**Files:**
- Create: `scripts/setup-bm25-indexes.ts`
- Modify: `package.json`

**Step 1: Create BM25 index setup script**

```typescript
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
```

**Step 2: Add script to package.json**

In `package.json` scripts section, add:
```json
"db:bm25-indexes": "bun run scripts/setup-bm25-indexes.ts"
```

**Step 3: Run the script**

Run: `bun run db:bm25-indexes`
Expected: "All BM25 indexes created successfully!"

**Step 4: Commit**

```bash
git add scripts/setup-bm25-indexes.ts package.json
git commit -m "feat: add BM25 index setup script"
```

---

## Task 6: Create CV Embedding Service

**Files:**
- Create: `src/lib/cv/cv-embeddings.ts`

**Step 1: Create embedding generation service**

```typescript
// src/lib/cv/cv-embeddings.ts
import { openai } from "@ai-sdk/openai";
import { embed } from "ai";

export async function generateCvEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: text,
  });

  return embedding;
}
```

**Step 2: Commit**

```bash
git add src/lib/cv/cv-embeddings.ts
git commit -m "feat: add CV embedding generation service"
```

---

## Task 7: Create CV Text Extractor

**Files:**
- Create: `src/lib/cv/cv-extractor.ts`
- Create: `src/lib/cv/cv-types.ts`

**Step 1: Create CV types**

```typescript
// src/lib/cv/cv-types.ts
import { z } from "zod";

export const cvExtractionSchema = z.object({
  fullText: z.string().describe("Complete extracted text from the CV"),
  skills: z.array(z.string()).describe("Technical and soft skills found"),
  experienceYears: z
    .number()
    .nullable()
    .describe("Estimated years of professional experience"),
  educationLevel: z
    .string()
    .nullable()
    .describe("Highest education level"),
  strengths: z.array(z.string()).describe("Key strengths (3-5 points)"),
  improvements: z.array(z.string()).describe("Areas for improvement (3-5 points)"),
  extractedSkills: z.array(z.string()).describe("All skills mentioned"),
});

export type CVExtraction = z.infer<typeof cvExtractionSchema>;
```

**Step 2: Create CV extractor**

```typescript
// src/lib/cv/cv-extractor.ts
import { openai } from "@ai-sdk/openai";
import { Output, generateText } from "ai";

import { type CVExtraction, cvExtractionSchema } from "./cv-types";

async function toDataUrl(input: {
  fileDataUrl: string;
  mediaType: string;
}): Promise<string> {
  if (input.fileDataUrl.startsWith("data:")) {
    return input.fileDataUrl;
  }

  const response = await fetch(input.fileDataUrl);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return `data:${input.mediaType};base64,${base64}`;
}

export async function extractCvText(input: {
  fileDataUrl: string;
  mediaType: string;
}): Promise<CVExtraction> {
  const dataUrl = await toDataUrl({
    fileDataUrl: input.fileDataUrl,
    mediaType: input.mediaType,
  });

  const { experimental_output: output } = await generateText({
    model: openai("gpt-4o"),
    experimental_output: Output.object({ schema: cvExtractionSchema }),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extract all text and analyze this CV/Resume.

**Instructions:**
1. Extract ALL readable text content from the document
2. Identify all technical and soft skills mentioned
3. Estimate years of professional experience from work history
4. Identify the highest education level
5. List 3-5 key strengths
6. List 3-5 areas for improvement

Return complete, accurate text extraction. The fullText field should contain ALL text from the CV.`,
          },
          {
            type: "file",
            data: dataUrl,
            mediaType: input.mediaType,
          },
        ],
      },
    ],
  });

  if (!output) {
    throw new Error("Failed to extract CV - no output from AI");
  }

  return output;
}
```

**Step 3: Commit**

```bash
git add src/lib/cv/cv-types.ts src/lib/cv/cv-extractor.ts
git commit -m "feat: add CV text extraction service"
```

---

## Task 8: Create Jobs BM25 Search

**Files:**
- Create: `src/lib/search/jobs-search.ts`

**Step 1: Create jobs BM25 search function**

```typescript
// src/lib/search/jobs-search.ts
import { and, desc, eq, sql } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";

import { jobs } from "@/lib/db/schema";

type SearchParams = {
  query?: string;
  location?: string;
  employmentType?: string;
  industry?: string;
  limit?: number;
  offset?: number;
};

export async function searchJobs(
  db: PgDatabase<any, any, any>,
  params: SearchParams
) {
  const {
    query,
    location,
    employmentType,
    industry,
    limit = 20,
    offset = 0,
  } = params;

  const conditions = [eq(jobs.isActive, true)];

  if (location) {
    conditions.push(eq(jobs.location, location));
  }
  if (employmentType) {
    conditions.push(eq(jobs.employmentType, employmentType));
  }
  if (industry) {
    conditions.push(eq(jobs.industry, industry));
  }

  // Use BM25 search if query provided
  if (query) {
    const searchResults = await db.execute(sql`
      SELECT j.*, paradedb.score(j.id) as rank
      FROM jobs j
      WHERE j.is_active = true
        ${location ? sql`AND j.location = ${location}` : sql``}
        ${employmentType ? sql`AND j.employment_type = ${employmentType}` : sql``}
        ${industry ? sql`AND j.industry = ${industry}` : sql``}
        AND (j.title @@@ ${query} OR j.description @@@ ${query})
      ORDER BY rank DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    const countResult = await db.execute(sql`
      SELECT count(*) as count
      FROM jobs j
      WHERE j.is_active = true
        ${location ? sql`AND j.location = ${location}` : sql``}
        ${employmentType ? sql`AND j.employment_type = ${employmentType}` : sql``}
        ${industry ? sql`AND j.industry = ${industry}` : sql``}
        AND (j.title @@@ ${query} OR j.description @@@ ${query})
    `);

    const total = Number(countResult.at(0)?.count ?? 0);

    return {
      jobs: searchResults as typeof jobs.$inferSelect[],
      total,
      hasMore: offset + searchResults.length < total,
    };
  }

  // No query - use regular filtering
  const [jobsList, countResult] = await Promise.all([
    db
      .select()
      .from(jobs)
      .where(and(...conditions))
      .orderBy(desc(jobs.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(and(...conditions)),
  ]);

  const total = Number(countResult.at(0)?.count ?? 0);

  return {
    jobs: jobsList,
    total,
    hasMore: offset + jobsList.length < total,
  };
}
```

**Step 2: Commit**

```bash
git add src/lib/search/jobs-search.ts
git commit -m "feat: add BM25 jobs search function"
```

---

## Task 9: Create Hybrid CV Search

**Files:**
- Create: `src/lib/search/cv-search.ts`

**Step 1: Create hybrid CV search function**

```typescript
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

  // Hybrid search with Reciprocal Rank Fusion
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
      c.*,
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
  const results = await db.execute(sql`
    SELECT *, paradedb.score(id) as rank
    FROM candidates
    WHERE full_name @@@ ${query} OR email @@@ ${query}
    ORDER BY rank DESC
    LIMIT ${limit}
  `);

  return results as Array<typeof candidates.$inferSelect & { rank: number }>;
}
```

**Step 2: Commit**

```bash
git add src/lib/search/cv-search.ts
git commit -m "feat: add hybrid CV search with RRF"
```

---

## Task 10: Update Jobs Router with BM25

**Files:**
- Modify: `src/orpc/routes/jobs.ts`

**Step 1: Replace jobs list handler**

Replace the entire file with:

```typescript
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import z from "zod";

import { jobs } from "@/lib/db/schema";
import { searchJobs } from "@/lib/search/jobs-search";

import { orpc, publicProcedure } from "../orpc-server";

export const jobsRouter = orpc.router({
  list: publicProcedure
    .input(
      z.object({
        location: z.string().optional(),
        employmentType: z.string().optional(),
        industry: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .handler(async ({ input, context }) => {
      return searchJobs(context.db, {
        query: input.search,
        location: input.location,
        employmentType: input.employmentType,
        industry: input.industry,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .handler(async ({ input, context }) => {
      const result = await context.db
        .select()
        .from(jobs)
        .where(and(eq(jobs.slug, input.slug), eq(jobs.isActive, true)))
        .limit(1);

      const job = result.at(0);

      if (!job) {
        throw new ORPCError("NOT_FOUND", { message: "Job not found" });
      }

      return job;
    }),
});
```

**Step 2: Commit**

```bash
git add src/orpc/routes/jobs.ts
git commit -m "feat: replace ILIKE with BM25 search in jobs router"
```

---

## Task 11: Update Applications Router

**Files:**
- Modify: `src/orpc/routes/applications.ts`

**Step 1: Replace create handler to use candidates/cvs**

Replace the entire file with:

```typescript
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { analyzeCV } from "@/lib/ai/cv-parser";
import { applications, candidates, cvs, file, jobs } from "@/lib/db/schema";
import { extractCvText } from "@/lib/cv/cv-extractor";
import { generateCvEmbedding } from "@/lib/cv/cv-embeddings";
import { sendApplicationConfirmation } from "@/lib/email/send-application-confirmation";
import { env } from "@/lib/env.server";
import { storage } from "@/lib/storage";

import { orpc, publicProcedure } from "../orpc-server";

export const applicationsRouter = orpc.router({
  create: publicProcedure
    .input(
      z.object({
        jobSlug: z.string(),
        fullName: z.string().min(2),
        email: z.email(),
        phone: z.string().optional(),
        message: z.string().optional(),
        cvFileName: z.string(),
        cvFileType: z.string(),
        cvFileData: z.string(),
      })
    )
    .handler(async ({ input, context }) => {
      // Get job by slug
      const [job] = await context.db
        .select()
        .from(jobs)
        .where(eq(jobs.slug, input.jobSlug))
        .limit(1);

      if (!job) {
        throw new ORPCError("NOT_FOUND", { message: "Job not found" });
      }

      if (!job.isActive) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Job is no longer accepting applications",
        });
      }

      // Upload CV to storage
      const cvKey = `applications/${job.id}/${crypto.randomUUID()}-${input.cvFileName}`;
      const buffer = Buffer.from(input.cvFileData, "base64");

      await storage.upload(cvKey, buffer, {
        contentType: input.cvFileType,
      });

      // Create file record
      const fileId = crypto.randomUUID();
      await context.db.insert(file).values({
        id: fileId,
        key: cvKey,
        provider: env.STORAGE_PROVIDER,
        bucket: env.S3_BUCKET,
        size: buffer.length,
        mimeType: input.cvFileType,
        fileName: input.cvFileName,
        purpose: "application_cv",
        metadata: { jobId: job.id, applicantEmail: input.email },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Find or create candidate
      const existingCandidate = await context.db
        .select()
        .from(candidates)
        .where(eq(candidates.email, input.email))
        .limit(1);

      let candidateId: string;

      if (existingCandidate.at(0)) {
        candidateId = existingCandidate[0].id;
        // Update name/phone if provided
        await context.db
          .update(candidates)
          .set({
            fullName: input.fullName,
            phone: input.phone ?? existingCandidate[0].phone,
          })
          .where(eq(candidates.id, candidateId));
      } else {
        candidateId = crypto.randomUUID();
        await context.db.insert(candidates).values({
          id: candidateId,
          email: input.email,
          fullName: input.fullName,
          phone: input.phone ?? null,
        });
      }

      // Get CV URL for AI extraction
      const cvUrl = storage.getUrl(cvKey, 3600);

      // Extract CV text and generate embedding
      let cvText: string | null = null;
      let cvEmbedding: number[] | null = null;
      let aiAnalysis = null;
      let aiScore: number | null = null;

      try {
        // Extract text from CV
        const extraction = await extractCvText({
          fileDataUrl: cvUrl,
          mediaType: input.cvFileType,
        });
        cvText = extraction.fullText;

        // Generate embedding
        if (cvText) {
          cvEmbedding = await generateCvEmbedding(cvText);
        }

        // Run full CV analysis
        const analysis = await analyzeCV({
          fileDataUrl: cvUrl,
          mediaType: input.cvFileType,
          jobRequirements: job.requirements ?? undefined,
        });
        aiAnalysis = analysis;
        aiScore = analysis.overallScore;
      } catch (error) {
        console.error("CV extraction/analysis failed:", error);
        // Continue without AI data - can be processed later
      }

      // Create CV record
      const cvId = crypto.randomUUID();
      await context.db.insert(cvs).values({
        id: cvId,
        candidateId,
        fileId,
        fileKey: cvKey,
        cvText,
        cvEmbedding,
        aiScore,
        aiAnalysis,
      });

      // Create application
      const applicationId = crypto.randomUUID();
      const [application] = await context.db
        .insert(applications)
        .values({
          id: applicationId,
          jobId: job.id,
          candidateId,
          cvId,
          message: input.message ?? null,
          status: "new",
        })
        .returning();

      // Send confirmation email
      sendApplicationConfirmation({
        candidateEmail: input.email,
        candidateName: input.fullName,
        jobTitle: job.title,
      }).catch((error) => {
        console.error("Failed to send application confirmation email:", error);
      });

      return {
        id: application.id,
        success: true,
      };
    }),
});
```

**Step 2: Commit**

```bash
git add src/orpc/routes/applications.ts
git commit -m "feat: update applications to create candidates and cvs"
```

---

## Task 12: Update Admin Applications Router

**Files:**
- Modify: `src/orpc/routes/admin/applications.ts`

**Step 1: Update to use new schema**

Replace the entire file with:

```typescript
import { ORPCError } from "@orpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { isAdminEmail } from "@/lib/auth/admin-check";
import { applications, candidates, cvs, file, jobs } from "@/lib/db/schema";
import { storage } from "@/lib/storage";

import { orpc, protectedProcedure } from "../../orpc-server";

const adminProcedure = protectedProcedure.use(async ({ context, next }) => {
  if (!isAdminEmail(context.session?.user?.email)) {
    throw new ORPCError("FORBIDDEN", { message: "Admin access required" });
  }
  return next({ context });
});

export const adminApplicationsRouter = orpc.router({
  list: adminProcedure
    .input(
      z.object({
        jobId: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .handler(async ({ input, context }) => {
      const conditions = [];

      if (input.jobId) {
        conditions.push(eq(applications.jobId, input.jobId));
      }
      if (input.status) {
        conditions.push(eq(applications.status, input.status));
      }

      const results = await context.db
        .select({
          application: applications,
          job: jobs,
          candidate: candidates,
          cv: cvs,
        })
        .from(applications)
        .leftJoin(jobs, eq(applications.jobId, jobs.id))
        .leftJoin(candidates, eq(applications.candidateId, candidates.id))
        .leftJoin(cvs, eq(applications.cvId, cvs.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(applications.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return {
        applications: results.map((r) => ({
          ...r.application,
          job: r.job,
          candidate: r.candidate,
          cv: r.cv,
          // Flatten for backward compatibility
          fullName: r.candidate?.fullName,
          email: r.candidate?.email,
          phone: r.candidate?.phone,
          aiScore: r.cv?.aiScore,
          aiAnalysis: r.cv?.aiAnalysis,
        })),
      };
    }),

  get: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const results = await context.db
        .select({
          application: applications,
          job: jobs,
          candidate: candidates,
          cv: cvs,
          cvFile: file,
        })
        .from(applications)
        .leftJoin(jobs, eq(applications.jobId, jobs.id))
        .leftJoin(candidates, eq(applications.candidateId, candidates.id))
        .leftJoin(cvs, eq(applications.cvId, cvs.id))
        .leftJoin(file, eq(cvs.fileId, file.id))
        .where(eq(applications.id, input.id))
        .limit(1);

      const result = results.at(0);

      if (!result) {
        throw new ORPCError("NOT_FOUND", { message: "Application not found" });
      }

      // Get CV download URL
      let cvUrl: string | null = null;
      if (result.cv?.fileKey) {
        cvUrl = storage.getUrl(result.cv.fileKey, 3600);
      }

      return {
        ...result.application,
        job: result.job,
        candidate: result.candidate,
        cv: result.cv,
        cvFile: result.cvFile,
        cvUrl,
        // Flatten for backward compatibility
        fullName: result.candidate?.fullName,
        email: result.candidate?.email,
        phone: result.candidate?.phone,
        aiScore: result.cv?.aiScore,
        aiAnalysis: result.cv?.aiAnalysis,
      };
    }),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["new", "reviewed", "shortlisted", "rejected"]),
      })
    )
    .handler(async ({ input, context }) => {
      const results = await context.db
        .update(applications)
        .set({ status: input.status })
        .where(eq(applications.id, input.id))
        .returning();

      const application = results.at(0);

      if (!application) {
        throw new ORPCError("NOT_FOUND", { message: "Application not found" });
      }

      return application;
    }),
});
```

**Step 2: Commit**

```bash
git add src/orpc/routes/admin/applications.ts
git commit -m "feat: update admin applications to use candidates/cvs"
```

---

## Task 13: Create Admin Search Router

**Files:**
- Create: `src/orpc/routes/admin/search.ts`
- Modify: `src/orpc/index.ts`

**Step 1: Create admin search router**

```typescript
// src/orpc/routes/admin/search.ts
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { isAdminEmail } from "@/lib/auth/admin-check";
import { hybridCvSearch, searchCandidates } from "@/lib/search/cv-search";

import { orpc, protectedProcedure } from "../../orpc-server";

const adminProcedure = protectedProcedure.use(async ({ context, next }) => {
  if (!isAdminEmail(context.session?.user?.email)) {
    throw new ORPCError("FORBIDDEN", { message: "Admin access required" });
  }
  return next({ context });
});

export const adminSearchRouter = orpc.router({
  cvs: adminProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().default(20),
      })
    )
    .handler(async ({ input, context }) => {
      const results = await hybridCvSearch(context.db, {
        query: input.query,
        limit: input.limit,
      });

      return { results };
    }),

  candidates: adminProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().default(20),
      })
    )
    .handler(async ({ input, context }) => {
      const results = await searchCandidates(
        context.db,
        input.query,
        input.limit
      );

      return { results };
    }),
});
```

**Step 2: Add to router**

In `src/orpc/index.ts`, add import:
```typescript
import { adminSearchRouter } from "./routes/admin/search";
```

Add to admin router:
```typescript
admin: orpc.router({
  check: adminCheckRouter,
  dashboard: adminDashboardRouter,
  jobs: adminJobsRouter,
  applications: adminApplicationsRouter,
  search: adminSearchRouter,
}),
```

**Step 3: Commit**

```bash
git add src/orpc/routes/admin/search.ts src/orpc/index.ts
git commit -m "feat: add admin search router with hybrid CV search"
```

---

## Task 14: Export New Schema Types

**Files:**
- Modify: `src/lib/db/schema/recruiting.ts`

**Step 1: Ensure all exports are present**

At the end of the file, verify these exports exist (add if missing):
```typescript
export { candidates, cvs, jobs, applications };
export {
  candidatesRelations,
  cvsRelations,
  jobsRelations,
  applicationsRelations,
};
```

**Step 2: Generate types**

Run: `bun run db:generate`
Expected: Types generated successfully

**Step 3: Commit**

```bash
git add src/lib/db/schema/recruiting.ts
git commit -m "chore: ensure schema exports are complete"
```

---

## Task 15: Final Integration Test

**Step 1: Run all setup scripts**

```bash
bun run db:pg-search
bun run db:generate
bun run db:push
bun run db:bm25-indexes
```

**Step 2: Start dev server and test**

Run: `bun run dev`

Test endpoints:
1. Visit `/jobs` and search for a job title - should return ranked results
2. Create a test application via the apply form
3. Check admin panel - application should show with extracted CV text and AI score

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete pg_search hybrid search integration"
```

---

## Summary

This plan implements:
- pg_search extension with BM25 indexes
- New `candidates` and `cvs` tables
- CV text extraction via AI
- Embedding generation for semantic search
- Hybrid search (BM25 + vector) with RRF scoring
- Updated jobs search with BM25 ranking
- Admin search endpoint for CV/candidate search
