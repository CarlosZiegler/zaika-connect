import { openai } from "@ai-sdk/openai";
import { Output, generateText } from "ai";
import { z } from "zod";

export const cvAnalysisSchema = z
  .object({
    overallScore: z
      .number()
      .min(0)
      .max(100)
      .describe("Overall CV quality score 0-100"),
    strengths: z
      .array(z.string())
      .describe("Key strengths of the CV (3-5 points)"),
    improvements: z
      .array(z.string())
      .describe("Specific actionable improvements (3-5 points)"),
    missingElements: z
      .array(z.string())
      .describe("Important missing sections or information"),
    extractedSkills: z.array(z.string()).describe("Skills found in the CV"),
    experienceYears: z
      .number()
      .nullable()
      .describe("Estimated total years of professional experience"),
    educationLevel: z
      .string()
      .nullable()
      .describe("Highest education level (e.g., Bachelor's, Master's, PhD)"),
    fitScore: z
      .number()
      .min(0)
      .max(100)
      .nullable()
      .describe("Job fit score 0-100 (only if job requirements provided)"),
    matchedSkills: z
      .array(z.string())
      .nullable()
      .describe("Skills matching job requirements"),
    missingSkills: z
      .array(z.string())
      .nullable()
      .describe("Required skills not found in CV"),
    redFlags: z
      .array(z.string())
      .nullable()
      .describe("Potential concerns (gaps, inconsistencies)"),
    interviewQuestions: z
      .array(z.string())
      .nullable()
      .describe("5 tailored interview questions for this candidate"),
  })
  .strict();

export type CVAnalysis = z.infer<typeof cvAnalysisSchema>;

async function toDataUrl(input: {
  fileDataUrl: string;
  mediaType: string;
}): Promise<string> {
  if (input.fileDataUrl.startsWith("data:")) {
    return input.fileDataUrl;
  }

  const response = await fetch(input.fileDataUrl);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return `data:${input.mediaType};base64,${base64}`;
}

export async function analyzeCV(input: {
  fileDataUrl: string;
  mediaType: string;
  jobRequirements?: string;
}): Promise<CVAnalysis> {
  const dataUrl = await toDataUrl({
    fileDataUrl: input.fileDataUrl,
    mediaType: input.mediaType,
  });

  const jobContext = input.jobRequirements
    ? `
**Job Requirements to evaluate against:**
${input.jobRequirements}

Include fitScore, matchedSkills, missingSkills, redFlags, and interviewQuestions in your analysis.
`
    : `
No job requirements provided. Set fitScore, matchedSkills, missingSkills, redFlags, and interviewQuestions to null.
`;

  const { experimental_output: output } = await generateText({
    model: openai("gpt-4o"),
    experimental_output: Output.object({ schema: cvAnalysisSchema }),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are an expert CV/resume analyst. Analyze this CV thoroughly.

**Instructions:**
1. Evaluate overall quality (formatting, clarity, completeness, professional presentation)
2. Extract all technical and soft skills mentioned
3. Estimate years of professional experience from work history
4. Identify the highest education level
5. List 3-5 key strengths that make this CV stand out
6. Provide 3-5 specific, actionable improvements
7. Note any missing important elements (contact info, skills section, etc.)
${jobContext}

**Scoring guide:**
- 90-100: Exceptional CV - well-structured, comprehensive, ready to impress
- 70-89: Good CV - minor improvements would help
- 50-69: Average CV - several areas need attention
- Below 50: Needs significant work

Be specific and actionable in your feedback. Focus on substance over style.`,
          },
          {
            type: "file",
            data: dataUrl,
            mediaType: input.mediaType,
          },
        ],
      },
    ],
  });

  if (!output) {
    throw new Error("Failed to analyze CV - no output from AI");
  }

  return output;
}
