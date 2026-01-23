import { ORPCError } from "@orpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import z from "zod";

import { jobs } from "@/lib/db/schema";

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
      const conditions = [eq(jobs.isActive, true)];

      if (input.location) {
        conditions.push(eq(jobs.location, input.location));
      }
      if (input.employmentType) {
        conditions.push(eq(jobs.employmentType, input.employmentType));
      }
      if (input.industry) {
        conditions.push(eq(jobs.industry, input.industry));
      }
      if (input.search) {
        conditions.push(
          sql`(${jobs.title} ILIKE ${`%${input.search}%`} OR ${jobs.description} ILIKE ${`%${input.search}%`})`
        );
      }

      const [jobsList, countResult] = await Promise.all([
        context.db
          .select()
          .from(jobs)
          .where(and(...conditions))
          .orderBy(desc(jobs.createdAt))
          .limit(input.limit)
          .offset(input.offset),
        context.db
          .select({ count: sql<number>`count(*)` })
          .from(jobs)
          .where(and(...conditions)),
      ]);

      return {
        jobs: jobsList,
        total: Number(countResult.at(0)?.count ?? 0),
        hasMore:
          input.offset + jobsList.length <
          Number(countResult.at(0)?.count ?? 0),
      };
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
