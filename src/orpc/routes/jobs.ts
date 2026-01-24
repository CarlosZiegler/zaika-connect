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
