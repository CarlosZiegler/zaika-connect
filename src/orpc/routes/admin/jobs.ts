import { ORPCError } from "@orpc/server";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { isAdminEmail } from "@/lib/auth/admin-check";
import { applications, cvs, jobs } from "@/lib/db/schema";

import { orpc, protectedProcedure } from "../../orpc-server";

// Admin middleware - checks if user email is whitelisted
const adminProcedure = protectedProcedure.use(async ({ context, next }) => {
  if (!isAdminEmail(context.session?.user?.email)) {
    throw new ORPCError("FORBIDDEN", { message: "Admin access required" });
  }
  return next({ context });
});

const jobInput = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  location: z.string(),
  employmentType: z.string(),
  industry: z.string(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  isActive: z.boolean().default(true),
});

export const adminJobsRouter = orpc.router({
  list: adminProcedure.handler(async ({ context }) => {
    const jobsList = await context.db
      .select({
        id: jobs.id,
        slug: jobs.slug,
        title: jobs.title,
        description: jobs.description,
        requirements: jobs.requirements,
        benefits: jobs.benefits,
        location: jobs.location,
        employmentType: jobs.employmentType,
        industry: jobs.industry,
        salaryMin: jobs.salaryMin,
        salaryMax: jobs.salaryMax,
        isActive: jobs.isActive,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
        applicationCount: sql<number>`cast(count(${applications.id}) as int)`,
      })
      .from(jobs)
      .leftJoin(applications, eq(jobs.id, applications.jobId))
      .groupBy(jobs.id)
      .orderBy(desc(jobs.createdAt));

    return { jobs: jobsList };
  }),

  get: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const result = await context.db
        .select()
        .from(jobs)
        .where(eq(jobs.id, input.id))
        .limit(1);

      const job = result.at(0);

      if (!job) {
        throw new ORPCError("NOT_FOUND", { message: "Job not found" });
      }

      return job;
    }),

  getWithStats: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const jobResult = await context.db
        .select()
        .from(jobs)
        .where(eq(jobs.id, input.id))
        .limit(1);

      const job = jobResult.at(0);

      if (!job) {
        throw new ORPCError("NOT_FOUND", { message: "Job not found" });
      }

      // Get stats with aiScore from cvs table
      const statsResult = await context.db
        .select({
          status: applications.status,
          count: sql<number>`cast(count(*) as int)`,
          avgScore: sql<number>`cast(avg(${cvs.aiScore}) as int)`,
        })
        .from(applications)
        .leftJoin(cvs, eq(applications.cvId, cvs.id))
        .where(eq(applications.jobId, input.id))
        .groupBy(applications.status);

      const stats = {
        total: 0,
        new: 0,
        reviewed: 0,
        shortlisted: 0,
        rejected: 0,
        avgScore: 0,
      };

      let totalScore = 0;
      let scoreCount = 0;

      for (const row of statsResult) {
        const count = Number(row.count);
        stats.total += count;
        stats[row.status as keyof typeof stats] = count;
        if (row.avgScore) {
          totalScore += row.avgScore * count;
          scoreCount += count;
        }
      }

      stats.avgScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

      return { job, stats };
    }),

  create: adminProcedure.input(jobInput).handler(async ({ input, context }) => {
    const result = await context.db
      .insert(jobs)
      .values({
        id: crypto.randomUUID(),
        ...input,
        salaryMin: input.salaryMin ?? null,
        salaryMax: input.salaryMax ?? null,
      })
      .returning();

    const job = result.at(0);

    if (!job) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create job",
      });
    }

    return job;
  }),

  update: adminProcedure
    .input(z.object({ id: z.string() }).merge(jobInput.partial()))
    .handler(async ({ input, context }) => {
      const { id, ...data } = input;

      const result = await context.db
        .update(jobs)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, id))
        .returning();

      const job = result.at(0);

      if (!job) {
        throw new ORPCError("NOT_FOUND", { message: "Job not found" });
      }

      return job;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      await context.db.delete(jobs).where(eq(jobs.id, input.id));
      return { success: true };
    }),

  toggleActive: adminProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .handler(async ({ input, context }) => {
      const result = await context.db
        .update(jobs)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(eq(jobs.id, input.id))
        .returning();

      const job = result.at(0);

      if (!job) {
        throw new ORPCError("NOT_FOUND", { message: "Job not found" });
      }

      return job;
    }),
});
