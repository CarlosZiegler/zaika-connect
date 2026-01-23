import { createFileRoute } from "@tanstack/react-router";

import { analyzeCV } from "@/lib/ai/cv-parser";

export const Route = createFileRoute("/api/ai/cv-review")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const formData = await request.formData();
          const file = formData.get("file") as File | null;

          if (!file) {
            return new Response(JSON.stringify({ error: "No file provided" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Validate file type
          const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ];
          if (!allowedTypes.includes(file.type)) {
            return new Response(
              JSON.stringify({
                error: "Invalid file type. Please upload PDF or DOCX.",
              }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          // Validate file size (10MB max)
          const maxSize = 10 * 1024 * 1024;
          if (file.size > maxSize) {
            return new Response(
              JSON.stringify({
                error: "File too large. Maximum size is 10MB.",
              }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          // Convert to data URL
          const arrayBuffer = await file.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString("base64");
          const dataUrl = `data:${file.type};base64,${base64}`;

          // Analyze CV (no job context for standalone review)
          const analysis = await analyzeCV({
            fileDataUrl: dataUrl,
            mediaType: file.type,
          });

          return new Response(JSON.stringify(analysis), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : "Failed to analyze CV";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
