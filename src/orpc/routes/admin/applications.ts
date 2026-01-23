import { ORPCError } from "@orpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { isAdminEmail } from "@/lib/auth/admin-check";
import { applications, file, jobs } from "@/lib/db/schema";
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
        })
        .from(applications)
        .leftJoin(jobs, eq(applications.jobId, jobs.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(applications.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return {
        applications: results.map((r) => ({
          ...r.application,
          job: r.job,
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
          cvFile: file,
        })
        .from(applications)
        .leftJoin(jobs, eq(applications.jobId, jobs.id))
        .leftJoin(file, eq(applications.cvFileId, file.id))
        .where(eq(applications.id, input.id))
        .limit(1);

      const result = results.at(0);

      if (!result) {
        throw new ORPCError("NOT_FOUND", { message: "Application not found" });
      }

      // Get CV download URL
      let cvUrl: string | null = null;
      if (result.application.cvFileKey) {
        cvUrl = storage.getUrl(result.application.cvFileKey, 3600);
      }

      return {
        ...result.application,
        job: result.job,
        cvFile: result.cvFile,
        cvUrl,
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
