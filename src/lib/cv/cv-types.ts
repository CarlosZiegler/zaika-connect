// src/lib/cv/cv-types.ts
import { z } from "zod";

export const cvExtractionSchema = z.object({
  fullText: z.string().describe("Complete extracted text from the CV"),
  skills: z.array(z.string()).describe("Technical and soft skills found"),
  experienceYears: z
    .number()
    .nullable()
    .describe("Estimated years of professional experience"),
  educationLevel: z
    .string()
    .nullable()
    .describe("Highest education level"),
  strengths: z.array(z.string()).describe("Key strengths (3-5 points)"),
  improvements: z.array(z.string()).describe("Areas for improvement (3-5 points)"),
  extractedSkills: z.array(z.string()).describe("All skills mentioned"),
});

export type CVExtraction = z.infer<typeof cvExtractionSchema>;
