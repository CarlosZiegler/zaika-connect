import { eq } from "drizzle-orm";

import type { DB } from "@/lib/db";

import { analyzeCV } from "@/lib/ai/cv-parser";
import { applications, cvs, jobs } from "@/lib/db/schema";
import { storage } from "@/lib/storage";

import { generateCvEmbedding } from "./cv-embeddings";
import { extractCvText } from "./cv-extractor";

type ProcessResult = {
  success: boolean;
  error?: string;
};

export async function processCv(
  db: DB,
  cvId: string,
  jobRequirements?: string | null
): Promise<ProcessResult> {
  const [cv] = await db.select().from(cvs).where(eq(cvs.id, cvId)).limit(1);

  if (!cv) return { success: false, error: "CV not found" };
  if (!cv.fileKey) return { success: false, error: "CV file not found" };

  await db
    .update(cvs)
    .set({ processingStatus: "processing" })
    .where(eq(cvs.id, cvId));

  try {
    const cvUrl = storage.getUrl(cv.fileKey, 3600);
    const mediaType = "application/pdf";

    const extraction = await extractCvText({ fileDataUrl: cvUrl, mediaType });

    const embedding = extraction.fullText
      ? await generateCvEmbedding(extraction.fullText)
      : null;

    const analysis = await analyzeCV({
      fileDataUrl: cvUrl,
      mediaType,
      jobRequirements: jobRequirements ?? undefined,
    });

    await db
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
      .where(eq(cvs.id, cvId));

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await db
      .update(cvs)
      .set({
        processingStatus: "failed",
        processingError: errorMessage,
      })
      .where(eq(cvs.id, cvId));
    return { success: false, error: errorMessage };
  }
}

export async function getJobRequirementsForCv(
  db: DB,
  cvId: string
): Promise<string | null> {
  const result = await db
    .select({ requirements: jobs.requirements })
    .from(cvs)
    .innerJoin(applications, eq(cvs.id, applications.cvId))
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(cvs.id, cvId))
    .limit(1);

  return result.at(0)?.requirements ?? null;
}
