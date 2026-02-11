import { ORPCError } from "@orpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { isAdminEmail } from "@/lib/auth/admin-check";
import { getJobRequirementsForCv, processCv } from "@/lib/cv/cv-processor";
import { applications, candidates, cvs, file, jobs } from "@/lib/db/schema";
import { getORPCErrorMetadataForKind } from "@/orpc/error-normalization";
import { ORPC_ERROR_KINDS } from "@/orpc/error-shared";
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
          processingStatus: r.cv?.processingStatus ?? "pending",
          processingError: r.cv?.processingError,
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
        processingStatus: result.cv?.processingStatus ?? "pending",
        processingError: result.cv?.processingError,
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

  getPendingCount: adminProcedure.handler(async ({ context }) => {
    const result = await context.db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(cvs)
      .where(eq(cvs.processingStatus, "pending"));

    return { count: result.at(0)?.count ?? 0 };
  }),

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

  reprocessCv: adminProcedure
    .input(z.object({ cvId: z.string() }))
    .handler(async ({ input, context }) => {
      const requirements = await getJobRequirementsForCv(
        context.db,
        input.cvId
      );

      const result = await processCv(context.db, input.cvId, requirements);

      if (!result.success) {
        const kind = result.errorKind ?? ORPC_ERROR_KINDS.UNEXPECTED;
        const mapped = getORPCErrorMetadataForKind(kind);

        throw new ORPCError(mapped.code, {
          status: mapped.status,
          message: mapped.message,
          data: {
            kind,
            procedure: "admin.applications.reprocessCv",
          },
        });
      }

      return { success: true };
    }),
});
