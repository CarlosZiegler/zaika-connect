# pg_search Hybrid Search Implementation

## Overview

Implement BM25 full-text search using pg_search (ParadeDB) on Neon PostgreSQL 17. Add hybrid search combining keyword matching with vector similarity for CV/candidate search.

## Goals

- Replace ILIKE with BM25 ranked search for jobs
- Add hybrid search (BM25 + vector) for CV matching
- Refactor schema: separate `candidates` and `cvs` tables
- Extract CV text via AI for full-text indexing
- Generate embeddings for semantic search

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Jobs Search (BM25 only)                                        │
│  - title + description indexed                                  │
│  - Relevance ranking replaces ILIKE                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  CV Search (Hybrid: BM25 + Vector)                              │
│  - BM25 on cv_text (keyword matching)                           │
│  - Vector similarity on cv_embedding (semantic)                 │
│  - Reciprocal Rank Fusion combines scores                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  CV Upload Flow                                                 │
│  PDF/DOC → AI Extract → { text, embedding, analysis } → DB     │
└─────────────────────────────────────────────────────────────────┘
```

## Schema Changes

### New Tables

```typescript
// Candidates (unique by email)
export const candidates = pgTable("candidates", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// CVs (one candidate can have multiple)
export const cvs = pgTable("cvs", {
  id: text("id").primaryKey(),
  candidateId: text("candidate_id")
    .references(() => candidates.id, { onDelete: "cascade" })
    .notNull(),
  fileId: text("file_id").references(() => file.id),
  fileKey: text("file_key"),
  cvText: text("cv_text"),                                    // BM25 search
  cvEmbedding: vector("cv_embedding", { dimensions: 1536 }),  // Hybrid search
  aiScore: integer("ai_score"),
  aiAnalysis: json("ai_analysis").$type<CVAnalysis>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Applications (simplified, references candidate + cv)
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

### Relationships

```
candidates (1) ──── (N) cvs
candidates (1) ──── (N) applications
cvs (1) ──── (N) applications
jobs (1) ──── (N) applications
```

## BM25 Indexes

```sql
-- Enable pg_search extension
CREATE EXTENSION IF NOT EXISTS pg_search;

-- Jobs: search title + description
CREATE INDEX jobs_bm25_idx ON jobs
USING bm25 (id, title, description)
WITH (key_field='id');

-- CVs: search full text
CREATE INDEX cvs_bm25_idx ON cvs
USING bm25 (id, cv_text)
WITH (key_field='id');

-- Candidates: search by name/email
CREATE INDEX candidates_bm25_idx ON candidates
USING bm25 (id, full_name, email)
WITH (key_field='id');

-- Vector index for hybrid search
CREATE INDEX cvs_embedding_idx ON cvs
USING hnsw (cv_embedding vector_cosine_ops);
```

## Search Queries

### Jobs BM25 Search

```typescript
const searchJobs = sql`
  SELECT *, paradedb.score(id) as rank
  FROM jobs
  WHERE title @@@ ${query} OR description @@@ ${query}
  ORDER BY rank DESC
  LIMIT ${limit}
`;
```

### Hybrid CV Search (BM25 + Vector with RRF)

```typescript
const hybridCVSearch = sql`
  WITH bm25_results AS (
    SELECT id, paradedb.score(id) as bm25_score
    FROM cvs
    WHERE cv_text @@@ ${query}
  ),
  vector_results AS (
    SELECT id, 1 - (cv_embedding <=> ${embedding}) as vector_score
    FROM cvs
    ORDER BY cv_embedding <=> ${embedding}
    LIMIT 100
  )
  SELECT
    c.*,
    COALESCE(1.0 / (60 + bm25.rank), 0) +
    COALESCE(1.0 / (60 + vec.rank), 0) as rrf_score
  FROM cvs c
  LEFT JOIN (SELECT id, ROW_NUMBER() OVER (ORDER BY bm25_score DESC) as rank FROM bm25_results) bm25 ON c.id = bm25.id
  LEFT JOIN (SELECT id, ROW_NUMBER() OVER (ORDER BY vector_score DESC) as rank FROM vector_results) vec ON c.id = vec.id
  WHERE bm25.id IS NOT NULL OR vec.id IS NOT NULL
  ORDER BY rrf_score DESC
  LIMIT ${limit}
`;
```

## CV Extraction Flow

1. User submits application with CV file
2. Upload CV to storage (S3/R2)
3. Find or create candidate by email
4. Send CV to AI for extraction:
   - Full text content
   - Skills analysis
   - Structured data (experience, education)
5. Generate embedding from extracted text
6. Save to `cvs` table
7. Create application linking candidate + cv + job

### AI Extraction

```typescript
const extractionPrompt = `
Analyze this CV/Resume and extract:

1. **Full Text**: Extract all readable text content
2. **Analysis**: Provide structured analysis

Return JSON:
{
  "fullText": "complete extracted text...",
  "skills": ["React", "TypeScript", ...],
  "experienceYears": 5,
  "educationLevel": "Bachelor's",
  "strengths": [...],
  "improvements": [...],
  "extractedSkills": [...]
}
`;
```

### Embedding Generation

```typescript
const embedding = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: cvText,
});
```

## File Structure

```
src/
├── lib/db/schema/recruiting.ts       # candidates, cvs, applications
├── lib/search/
│   ├── jobs-search.ts                # BM25 job search
│   ├── cv-search.ts                  # Hybrid CV search
│   └── search-types.ts               # Types
├── lib/cv/
│   ├── cv-extractor.ts               # AI extraction
│   ├── cv-embeddings.ts              # Embedding generation
│   └── cv-types.ts                   # Types
├── orpc/routes/
│   ├── jobs.ts                       # Modified: BM25 search
│   ├── candidates.ts                 # New: candidate CRUD
│   ├── cvs.ts                        # New: CV operations
│   └── admin/search.ts               # New: hybrid search
└── routes/api/cv/extract.ts          # Extraction endpoint
```

## DB Commands

```bash
bun run db:generate  # Generate migrations
bun run db:push      # Push to database
```

## Key Decisions

- **pg_search (ParadeDB)** over pg_textsearch - Available on Neon now
- **Separate candidates/cvs tables** - Reusability, cleaner search, CV versioning
- **AI extraction** - Single call for text + analysis (simpler than parser libraries)
- **Hybrid search for CVs** - BM25 keywords + vector semantics with RRF fusion
- **BM25 only for jobs** - Users search specific keywords, no need for semantic
