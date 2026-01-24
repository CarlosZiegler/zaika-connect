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
        // Update name/phone if provided
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

      // Create CV record
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

      // Send confirmation email
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
