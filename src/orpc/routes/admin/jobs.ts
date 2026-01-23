import { ORPCError } from "@orpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { isAdminEmail } from "@/lib/auth/admin-check";
import { jobs } from "@/lib/db/schema";

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
      .select()
      .from(jobs)
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
