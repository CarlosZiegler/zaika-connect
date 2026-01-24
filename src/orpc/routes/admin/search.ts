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
