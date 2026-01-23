import { openai } from "@ai-sdk/openai";
import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";

export const Route = createFileRoute("/api/ai/job-chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const { jobId, messages } = await request.json();

          if (!jobId) {
            return new Response(
              JSON.stringify({ error: "Job ID is required" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          // Get job details
          const results = await db
            .select()
            .from(jobs)
            .where(eq(jobs.id, jobId))
            .limit(1);

          const job = results.at(0);

          if (!job) {
            return new Response(JSON.stringify({ error: "Job not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          const systemPrompt = `You are a helpful recruiting assistant for ZaikaConnect. You help candidates learn about job opportunities and guide them through the application process.

**Current Job:**
Title: ${job.title}
Location: ${job.location}
Employment Type: ${job.employmentType}
Industry: ${job.industry}

**Description:**
${job.description}

**Requirements:**
${job.requirements ?? "Not specified"}

**Benefits:**
${job.benefits ?? "Not specified"}

${job.salaryMin && job.salaryMax ? `**Salary Range:** EUR${job.salaryMin.toLocaleString()} - EUR${job.salaryMax.toLocaleString()}` : ""}

**Guidelines:**
- Answer questions about this specific job accurately and helpfully
- Be concise but thorough - aim for 2-3 sentences unless more detail is needed
- If asked about other jobs, suggest they browse the jobs page at /jobs
- Encourage qualified candidates to apply at /apply/${job.slug}
- Don't make up information not in the job description
- If you don't know something specific, suggest they contact the recruiting team
- Be professional and friendly`;

          const result = streamText({
            model: openai("gpt-4o-mini"),
            system: systemPrompt,
            messages,
          });

          return result.toTextStreamResponse();
        } catch (error: unknown) {
          console.error("Job chat error:", error);
          const message =
            error instanceof Error ? error.message : "Chat failed";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
