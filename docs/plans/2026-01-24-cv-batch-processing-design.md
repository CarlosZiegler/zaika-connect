# CV Batch Processing Design

## Overview

Move AI processing out of application submission flow. User submits application fast (~2s), admin triggers batch processing manually via dashboard button.

## Goals

- Application submit under 3 seconds (was 35s)
- Admin can process pending CVs in batch
- Admin can re-process individual CVs
- Real-time status updates via polling

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Application Submit (Fast Path ~2s)                             │
│  1. Validate job exists                                         │
│  2. Upload CV to S3                                             │
│  3. Create candidate/cv/application records                     │
│  4. CV saved with processingStatus: "pending"                   │
│  5. Send confirmation email (fire-and-forget)                   │
│  6. Return success to user                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Admin Dashboard                                                │
│  - Shows pending count badge                                    │
│  - "Process Pending CVs (N)" button                             │
│  - Polls every 2s when processing                               │
│  - Status badges: pending | processing | completed | failed     │
│  - "Re-analyze" button per CV (for completed/failed)            │
└─────────────────────────────────────────────────────────────────┘
```

## Schema Changes

### CVs Table - Add Processing Fields

```typescript
export const cvs = pgTable("cvs", {
  // ... existing fields ...

  processingStatus: text("processing_status")
    .default("pending")
    .notNull(),  // pending | processing | completed | failed
  processingError: text("processing_error"),
  processedAt: timestamp("processed_at"),
});
```

**Status Flow:**
- `pending` → CV uploaded, waiting for processing
- `processing` → Currently being analyzed
- `completed` → All AI processing done
- `failed` → Error occurred (can retry)

## API Changes

### Applications Router (Public)

Remove AI calls from create handler - just save with pending status:

```typescript
// After uploading CV and creating records
await context.db.insert(cvs).values({
  id: cvId,
  candidateId,
  fileId,
  fileKey: cvKey,
  cvText: null,           // Filled by processing
  cvEmbedding: null,      // Filled by processing
  aiScore: null,          // Filled by processing
  aiAnalysis: null,       // Filled by processing
  processingStatus: "pending",
});
```

### Admin Applications Router

**New: processPending**

```typescript
processPending: adminProcedure
  .handler(async ({ context }) => {
    const pending = await context.db
      .select()
      .from(cvs)
      .innerJoin(applications, eq(cvs.id, applications.cvId))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(eq(cvs.processingStatus, "pending"))
      .limit(10);

    let processed = 0;
    let failed = 0;

    for (const row of pending) {
      const cv = row.cvs;
      const job = row.jobs;

      await context.db
        .update(cvs)
        .set({ processingStatus: "processing" })
        .where(eq(cvs.id, cv.id));

      try {
        const cvUrl = storage.getUrl(cv.fileKey!, 3600);

        // Extract text
        const extraction = await extractCvText({
          fileDataUrl: cvUrl,
          mediaType: "application/pdf",
        });

        // Generate embedding
        const embedding = extraction.fullText
          ? await generateCvEmbedding(extraction.fullText)
          : null;

        // Analyze CV
        const analysis = await analyzeCV({
          fileDataUrl: cvUrl,
          mediaType: "application/pdf",
          jobRequirements: job.requirements ?? undefined,
        });

        await context.db
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
          .where(eq(cvs.id, cv.id));

        processed++;
      } catch (error) {
        await context.db
          .update(cvs)
          .set({
            processingStatus: "failed",
            processingError: error instanceof Error ? error.message : "Unknown error",
          })
          .where(eq(cvs.id, cv.id));

        failed++;
      }
    }

    return { processed, failed, total: pending.length };
  }),
```

**New: reprocessCv**

```typescript
reprocessCv: adminProcedure
  .input(z.object({ cvId: z.string() }))
  .handler(async ({ input, context }) => {
    // Get CV with job info
    const result = await context.db
      .select()
      .from(cvs)
      .innerJoin(applications, eq(cvs.id, applications.cvId))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(eq(cvs.id, input.cvId))
      .limit(1);

    const row = result.at(0);
    if (!row) {
      throw new ORPCError("NOT_FOUND", { message: "CV not found" });
    }

    // Reset and process
    await context.db
      .update(cvs)
      .set({ processingStatus: "processing", processingError: null })
      .where(eq(cvs.id, input.cvId));

    // ... same processing logic as above ...

    return { success: true };
  }),
```

**New: getPendingCount**

```typescript
getPendingCount: adminProcedure
  .handler(async ({ context }) => {
    const result = await context.db
      .select({ count: sql<number>`count(*)` })
      .from(cvs)
      .where(eq(cvs.processingStatus, "pending"));

    return { count: Number(result.at(0)?.count ?? 0) };
  }),
```

## UI Components

### Process Button Component

```typescript
// src/features/admin/applications/process-button.tsx
export function ProcessPendingButton() {
  const pendingQuery = orpc.admin.applications.getPendingCount.useQuery(
    undefined,
    { refetchInterval: 2000 }  // Poll every 2s
  );

  const processMutation = orpc.admin.applications.processPending.useMutation({
    onSuccess: (data) => {
      toast.success(`Processed ${data.processed} CVs`);
      pendingQuery.refetch();
    },
  });

  const count = pendingQuery.data?.count ?? 0;

  return (
    <Button
      onClick={() => processMutation.mutate()}
      disabled={count === 0 || processMutation.isPending}
    >
      {processMutation.isPending ? (
        <>
          <Spinner /> Processing...
        </>
      ) : (
        `Process Pending CVs (${count})`
      )}
    </Button>
  );
}
```

### Status Badge Component

```typescript
// src/features/admin/applications/processing-status-badge.tsx
const statusConfig = {
  pending: { label: "Pending", color: "gray", icon: Clock },
  processing: { label: "Processing", color: "blue", icon: Spinner },
  completed: { label: "Analyzed", color: "green", icon: Check },
  failed: { label: "Failed", color: "red", icon: AlertCircle },
};

export function ProcessingStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? statusConfig.pending;
  return (
    <Badge variant={config.color}>
      <config.icon className="size-3" />
      {config.label}
    </Badge>
  );
}
```

## File Structure

**Modify:**
- `src/lib/db/schema/recruiting.ts` - Add processing fields to cvs
- `src/orpc/routes/applications.ts` - Remove AI calls
- `src/orpc/routes/admin/applications.ts` - Add processPending, reprocessCv, getPendingCount

**Create:**
- `src/features/admin/applications/process-button.tsx`
- `src/features/admin/applications/processing-status-badge.tsx`

## Key Decisions

- **No background workers** - Admin-triggered only, simpler for serverless
- **Batch limit of 10** - Prevents timeout, admin can click again
- **Sequential processing** - One CV at a time, easier error handling
- **Polling every 2s** - Real-time feel without WebSockets
- **Re-process option** - Handle failures, update after job requirements change
