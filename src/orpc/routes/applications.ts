import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { applications, file, jobs } from "@/lib/db/schema";
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
        // CV file passed as base64 data
        cvFileName: z.string(),
        cvFileType: z.string(),
        cvFileData: z.string(), // base64 encoded file data
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

      // Decode and upload CV to storage
      const cvKey = `applications/${job.id}/${crypto.randomUUID()}-${input.cvFileName}`;
      const buffer = Buffer.from(input.cvFileData, "base64");

      await storage.upload(cvKey, buffer, {
        contentType: input.cvFileType,
      });

      // Create file record for tracking
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

      // Create application
      const applicationId = crypto.randomUUID();
      const [application] = await context.db
        .insert(applications)
        .values({
          id: applicationId,
          jobId: job.id,
          fullName: input.fullName,
          email: input.email,
          phone: input.phone ?? null,
          message: input.message ?? null,
          cvFileId: fileId,
          cvFileKey: cvKey,
          status: "new",
        })
        .returning();

      // TODO: Trigger AI scoring in background

      // Send confirmation email (fire and forget - don't block on failure)
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
