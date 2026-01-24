# CV Batch Processing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move AI processing out of application submit flow, add admin-triggered batch processing with polling.

**Architecture:** Application submit saves CV with `processingStatus: "pending"`. Admin clicks button to process pending CVs. Frontend polls for status updates.

**Tech Stack:** Drizzle ORM, ORPC, TanStack Query, OpenAI

---

## Task 1: Add Processing Fields to CVs Schema

**Files:**
- Modify: `src/lib/db/schema/recruiting.ts:43-64`

**Step 1: Add processing fields to cvs table**

In the cvs table definition, add after `createdAt`:

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
    processingStatus: text("processing_status").default("pending").notNull(),
    processingError: text("processing_error"),
    processedAt: timestamp("processed_at"),
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

**Step 2: Generate and push schema**

Run: `bun run db:generate && bun run db:push`
Expected: Migration applied successfully

**Step 3: Commit**

```bash
git add src/lib/db/schema/recruiting.ts
git commit -m "feat: add processing status fields to cvs table"
```

---

## Task 2: Simplify Applications Create Handler

**Files:**
- Modify: `src/orpc/routes/applications.ts`

**Step 1: Remove AI imports and processing**

Replace the entire file with:

```typescript
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { applications, candidates, cvs, file, jobs } from "@/lib/db/schema";
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

      // Create CV record with pending status
      const cvId = crypto.randomUUID();
      await context.db.insert(cvs).values({
        id: cvId,
        candidateId,
        fileId,
        fileKey: cvKey,
        processingStatus: "pending",
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

      // Send confirmation email (fire-and-forget)
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
git commit -m "feat: remove AI processing from application submit"
```

---

## Task 3: Create CV Processing Service

**Files:**
- Create: `src/lib/cv/cv-processor.ts`

**Step 1: Create processing service**

```typescript
// src/lib/cv/cv-processor.ts
import { eq } from "drizzle-orm";

import { analyzeCV } from "@/lib/ai/cv-parser";
import type { DB } from "@/lib/db";
import { cvs, jobs, applications } from "@/lib/db/schema";
import { storage } from "@/lib/storage";

import { extractCvText } from "./cv-extractor";
import { generateCvEmbedding } from "./cv-embeddings";

type ProcessResult = {
  success: boolean;
  error?: string;
};

export async function processCv(
  db: DB,
  cvId: string,
  jobRequirements?: string | null
): Promise<ProcessResult> {
  // Get CV record
  const [cv] = await db
    .select()
    .from(cvs)
    .where(eq(cvs.id, cvId))
    .limit(1);

  if (!cv) {
    return { success: false, error: "CV not found" };
  }

  if (!cv.fileKey) {
    return { success: false, error: "CV file not found" };
  }

  // Mark as processing
  await db
    .update(cvs)
    .set({ processingStatus: "processing" })
    .where(eq(cvs.id, cvId));

  try {
    const cvUrl = storage.getUrl(cv.fileKey, 3600);

    // Get file mime type from file record
    const mediaType = "application/pdf"; // Default, could be fetched from file table

    // Extract text
    const extraction = await extractCvText({
      fileDataUrl: cvUrl,
      mediaType,
    });

    // Generate embedding
    const embedding = extraction.fullText
      ? await generateCvEmbedding(extraction.fullText)
      : null;

    // Analyze CV
    const analysis = await analyzeCV({
      fileDataUrl: cvUrl,
      mediaType,
      jobRequirements: jobRequirements ?? undefined,
    });

    // Update CV with results
    await db
      .update(cvs)
      .set({
        cvText: extraction.fullText,
        cvEmbedding: embedding,
        aiScore: analysis.overallScore,
        aiAnalysis: analysis,
        processingStatus: "completed",
        processingError: null,
        processedAt: new Date(),
      })
      .where(eq(cvs.id, cvId));

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await db
      .update(cvs)
      .set({
        processingStatus: "failed",
        processingError: errorMessage,
      })
      .where(eq(cvs.id, cvId));

    return { success: false, error: errorMessage };
  }
}

export async function getJobRequirementsForCv(
  db: DB,
  cvId: string
): Promise<string | null> {
  const result = await db
    .select({ requirements: jobs.requirements })
    .from(cvs)
    .innerJoin(applications, eq(cvs.id, applications.cvId))
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(cvs.id, cvId))
    .limit(1);

  return result.at(0)?.requirements ?? null;
}
```

**Step 2: Commit**

```bash
git add src/lib/cv/cv-processor.ts
git commit -m "feat: add CV processing service"
```

---

## Task 4: Add Admin Processing Endpoints

**Files:**
- Modify: `src/orpc/routes/admin/applications.ts`

**Step 1: Add imports**

Add at top of file:

```typescript
import { sql } from "drizzle-orm";

import { getJobRequirementsForCv, processCv } from "@/lib/cv/cv-processor";
```

**Step 2: Add getPendingCount endpoint**

Add after updateStatus in the router:

```typescript
  getPendingCount: adminProcedure.handler(async ({ context }) => {
    const result = await context.db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(cvs)
      .where(eq(cvs.processingStatus, "pending"));

    return { count: result.at(0)?.count ?? 0 };
  }),
```

**Step 3: Add processPending endpoint**

Add after getPendingCount:

```typescript
  processPending: adminProcedure
    .input(
      z.object({
        limit: z.number().default(10),
      })
    )
    .handler(async ({ input, context }) => {
      // Get pending CVs with job info
      const pending = await context.db
        .select({
          cv: cvs,
          jobRequirements: jobs.requirements,
        })
        .from(cvs)
        .innerJoin(applications, eq(cvs.id, applications.cvId))
        .innerJoin(jobs, eq(applications.jobId, jobs.id))
        .where(eq(cvs.processingStatus, "pending"))
        .limit(input.limit);

      let processed = 0;
      let failed = 0;

      for (const row of pending) {
        const result = await processCv(
          context.db,
          row.cv.id,
          row.jobRequirements
        );

        if (result.success) {
          processed++;
        } else {
          failed++;
        }
      }

      return { processed, failed, total: pending.length };
    }),
```

**Step 4: Add reprocessCv endpoint**

Add after processPending:

```typescript
  reprocessCv: adminProcedure
    .input(z.object({ cvId: z.string() }))
    .handler(async ({ input, context }) => {
      const requirements = await getJobRequirementsForCv(
        context.db,
        input.cvId
      );

      const result = await processCv(
        context.db,
        input.cvId,
        requirements
      );

      if (!result.success) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: result.error ?? "Processing failed",
        });
      }

      return { success: true };
    }),
```

**Step 5: Commit**

```bash
git add src/orpc/routes/admin/applications.ts
git commit -m "feat: add admin CV processing endpoints"
```

---

## Task 5: Update Admin List to Include Processing Status

**Files:**
- Modify: `src/orpc/routes/admin/applications.ts`

**Step 1: Update list handler return**

In the list handler, update the return to include processingStatus:

```typescript
      return {
        applications: results.map((r) => ({
          ...r.application,
          job: r.job,
          candidate: r.candidate,
          cv: r.cv,
          fullName: r.candidate?.fullName,
          email: r.candidate?.email,
          phone: r.candidate?.phone,
          aiScore: r.cv?.aiScore,
          aiAnalysis: r.cv?.aiAnalysis,
          processingStatus: r.cv?.processingStatus ?? "pending",
          processingError: r.cv?.processingError,
        })),
      };
```

**Step 2: Update get handler return**

In the get handler, update the return similarly:

```typescript
      return {
        ...result.application,
        job: result.job,
        candidate: result.candidate,
        cv: result.cv,
        cvFile: result.cvFile,
        cvUrl,
        fullName: result.candidate?.fullName,
        email: result.candidate?.email,
        phone: result.candidate?.phone,
        aiScore: result.cv?.aiScore,
        aiAnalysis: result.cv?.aiAnalysis,
        processingStatus: result.cv?.processingStatus ?? "pending",
        processingError: result.cv?.processingError,
      };
```

**Step 3: Commit**

```bash
git add src/orpc/routes/admin/applications.ts
git commit -m "feat: include processing status in application responses"
```

---

## Task 6: Create Processing Status Badge Component

**Files:**
- Create: `src/features/admin/applications/processing-status-badge.tsx`

**Step 1: Create badge component**

```typescript
// src/features/admin/applications/processing-status-badge.tsx
import {
  IconCheck,
  IconClock,
  IconLoader2,
  IconAlertCircle,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig = {
  pending: {
    label: "Pending",
    variant: "secondary" as const,
    Icon: IconClock,
  },
  processing: {
    label: "Processing",
    variant: "default" as const,
    Icon: IconLoader2,
  },
  completed: {
    label: "Analyzed",
    variant: "success" as const,
    Icon: IconCheck,
  },
  failed: {
    label: "Failed",
    variant: "destructive" as const,
    Icon: IconAlertCircle,
  },
} as const;

type ProcessingStatus = keyof typeof statusConfig;

type ProcessingStatusBadgeProps = {
  status: string;
  error?: string | null;
  className?: string;
};

export function ProcessingStatusBadge({
  status,
  error,
  className,
}: ProcessingStatusBadgeProps) {
  const config = statusConfig[status as ProcessingStatus] ?? statusConfig.pending;
  const { Icon, label, variant } = config;

  return (
    <Badge
      variant={variant}
      className={cn("gap-1", className)}
      title={error ?? undefined}
    >
      <Icon
        className={cn(
          "size-3",
          status === "processing" && "animate-spin"
        )}
      />
      {label}
    </Badge>
  );
}
```

**Step 2: Commit**

```bash
git add src/features/admin/applications/processing-status-badge.tsx
git commit -m "feat: add processing status badge component"
```

---

## Task 7: Create Process Pending Button Component

**Files:**
- Create: `src/features/admin/applications/process-pending-button.tsx`

**Step 1: Create button component**

```typescript
// src/features/admin/applications/process-pending-button.tsx
import { IconLoader2, IconPlayerPlay } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { orpc } from "@/lib/orpc/react";

export function ProcessPendingButton() {
  const pendingQuery = orpc.admin.applications.getPendingCount.useQuery(
    undefined,
    {
      refetchInterval: 2000,
    }
  );

  const processMutation = orpc.admin.applications.processPending.useMutation({
    onSuccess: (data) => {
      if (data.processed > 0) {
        toast.success(`Processed ${data.processed} CVs`);
      }
      if (data.failed > 0) {
        toast.error(`${data.failed} CVs failed to process`);
      }
      pendingQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Processing failed: ${error.message}`);
    },
  });

  const count = pendingQuery.data?.count ?? 0;
  const isProcessing = processMutation.isPending;

  if (count === 0 && !isProcessing) {
    return null;
  }

  return (
    <Button
      onClick={() => processMutation.mutate({ limit: 10 })}
      disabled={count === 0 || isProcessing}
      variant="outline"
      size="sm"
    >
      {isProcessing ? (
        <>
          <IconLoader2 className="size-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <IconPlayerPlay className="size-4" />
          Process Pending ({count})
        </>
      )}
    </Button>
  );
}
```

**Step 2: Commit**

```bash
git add src/features/admin/applications/process-pending-button.tsx
git commit -m "feat: add process pending button component"
```

---

## Task 8: Create Reprocess Button Component

**Files:**
- Create: `src/features/admin/applications/reprocess-button.tsx`

**Step 1: Create reprocess button**

```typescript
// src/features/admin/applications/reprocess-button.tsx
import { IconLoader2, IconRefresh } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { orpc } from "@/lib/orpc/react";

type ReprocessButtonProps = {
  cvId: string;
  status: string;
  onSuccess?: () => void;
};

export function ReprocessButton({
  cvId,
  status,
  onSuccess,
}: ReprocessButtonProps) {
  const reprocessMutation = orpc.admin.applications.reprocessCv.useMutation({
    onSuccess: () => {
      toast.success("CV reprocessing started");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Reprocessing failed: ${error.message}`);
    },
  });

  // Only show for completed or failed CVs
  if (status !== "completed" && status !== "failed") {
    return null;
  }

  return (
    <Button
      onClick={() => reprocessMutation.mutate({ cvId })}
      disabled={reprocessMutation.isPending}
      variant="ghost"
      size="sm"
    >
      {reprocessMutation.isPending ? (
        <IconLoader2 className="size-4 animate-spin" />
      ) : (
        <IconRefresh className="size-4" />
      )}
      Re-analyze
    </Button>
  );
}
```

**Step 2: Commit**

```bash
git add src/features/admin/applications/reprocess-button.tsx
git commit -m "feat: add reprocess button component"
```

---

## Task 9: Update Application Kanban Card

**Files:**
- Modify: `src/features/admin/job-detail/application-kanban-card.tsx`

**Step 1: Read current file**

Read the file to understand current structure.

**Step 2: Add processing status badge**

Import and add the ProcessingStatusBadge to the card, showing it when status is not "completed".

Add import:
```typescript
import { ProcessingStatusBadge } from "@/features/admin/applications/processing-status-badge";
```

Add to card content (before or instead of AI score when not completed):
```typescript
{application.processingStatus !== "completed" ? (
  <ProcessingStatusBadge
    status={application.processingStatus}
    error={application.processingError}
  />
) : (
  <AIScoreBadge score={application.aiScore} />
)}
```

**Step 3: Commit**

```bash
git add src/features/admin/job-detail/application-kanban-card.tsx
git commit -m "feat: show processing status in kanban cards"
```

---

## Task 10: Add Process Button to Job Detail Page

**Files:**
- Modify: `src/features/admin/job-detail/job-detail.page.tsx`

**Step 1: Import process button**

Add import:
```typescript
import { ProcessPendingButton } from "@/features/admin/applications/process-pending-button";
```

**Step 2: Add button to header/actions area**

Add the ProcessPendingButton next to other action buttons in the page header.

**Step 3: Commit**

```bash
git add src/features/admin/job-detail/job-detail.page.tsx
git commit -m "feat: add process pending button to job detail page"
```

---

## Task 11: Enable Polling for Applications List

**Files:**
- Modify: `src/features/admin/job-detail/job-detail-applications.tsx`

**Step 1: Add refetchInterval to applications query**

Find the useQuery call for applications and add polling:

```typescript
const applicationsQuery = orpc.admin.applications.list.useQuery(
  { jobId },
  {
    refetchInterval: (query) => {
      // Poll every 2s if any CV is pending/processing
      const hasProcessing = query.state.data?.applications.some(
        (app) =>
          app.processingStatus === "pending" ||
          app.processingStatus === "processing"
      );
      return hasProcessing ? 2000 : false;
    },
  }
);
```

**Step 2: Commit**

```bash
git add src/features/admin/job-detail/job-detail-applications.tsx
git commit -m "feat: enable polling for processing status updates"
```

---

## Task 12: Test End-to-End Flow

**Step 1: Start dev server**

Run: `bun run dev`

**Step 2: Test application submit**

- Submit a new application with CV
- Verify it completes in ~2-3 seconds (not 35s)
- Check that CV is saved with processingStatus: "pending"

**Step 3: Test admin processing**

- Go to admin job detail page
- See "Process Pending (1)" button
- Click to process
- Watch status update from "Pending" → "Processing" → "Completed"
- Verify AI score appears after completion

**Step 4: Test re-process**

- Click "Re-analyze" on a completed CV
- Verify it re-processes

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete CV batch processing implementation"
```

---

## Summary

This plan implements:
- Fast application submit (~2s instead of 35s)
- `processingStatus` field on cvs table
- Admin endpoints: getPendingCount, processPending, reprocessCv
- ProcessingStatusBadge component
- ProcessPendingButton with polling
- ReprocessButton for completed/failed CVs
- Polling in applications list for real-time updates
