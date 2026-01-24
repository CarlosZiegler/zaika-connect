import { openai } from "@ai-sdk/openai";
import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";

export const Route = createFileRoute("/api/ai/job-description")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const { action, description, jobTitle, sectionType, userMessage } =
            body;

          const systemPrompt = getSystemPrompt(action, sectionType);
          const userPrompt = getUserPrompt(
            action,
            description,
            jobTitle,
            sectionType,
            userMessage
          );

          const result = streamText({
            model: openai("gpt-4o-mini"),
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
          });

          return result.toTextStreamResponse();
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : "An error occurred";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});

function getSystemPrompt(action: string, sectionType?: string): string {
  const basePrompt = `You are a professional job description writer. Write in markdown format with proper headings, bullet points, and formatting. Be concise but comprehensive.

IMPORTANT: Output ONLY the raw markdown content. Do NOT wrap your response in code blocks like \`\`\`markdown or \`\`\`. The content will be rendered as markdown directly.`;

  switch (action) {
    case "generate":
      return `${basePrompt} Generate a complete, professional job description based on the job title provided. Include sections for role overview, responsibilities, and what makes this role exciting.`;

    case "improve":
      return `${basePrompt} Improve the provided job description. Fix grammar, enhance clarity, improve structure, and make it more engaging while keeping the core content.`;

    case "format":
      return `${basePrompt} Convert the provided text into well-formatted markdown. Add appropriate headings, bullet points, and structure without changing the content meaning.`;

    case "add-section":
      return `${basePrompt} Add a new "${sectionType}" section to the job description. Write only the new section content, starting with a markdown heading.`;

    case "shorter":
      return `${basePrompt} Condense the job description while keeping all key information. Remove redundancy and make it more concise.`;

    case "longer":
      return `${basePrompt} Expand the job description with more detail. Add relevant information that would help candidates understand the role better.`;

    case "chat":
      return `${basePrompt} You are helping edit a job description through conversation.

IMPORTANT: When the user asks for changes, improvements, or new content, ALWAYS output the COMPLETE updated job description that they can apply directly. Do not just explain what to change - provide the full ready-to-use markdown content.

The user has an "Apply to Description" button that will replace their current description with your response, so make sure your response is a complete, polished job description.

If the user asks a question that doesn't require changing the description (like "what does this mean?"), you can respond conversationally without providing a full description.`;

    default:
      return basePrompt;
  }
}

function getUserPrompt(
  action: string,
  description: string,
  jobTitle: string,
  sectionType?: string,
  userMessage?: string
): string {
  switch (action) {
    case "generate":
      return `Generate a job description for: ${jobTitle}`;

    case "improve":
    case "format":
    case "shorter":
    case "longer":
      return `Job Description:\n\n${description}`;

    case "add-section":
      return `Current Job Description:\n\n${description}\n\nAdd a "${sectionType}" section.`;

    case "chat":
      return `Current Job Description:\n\n${description}\n\nUser request: ${userMessage}`;

    default:
      return description;
  }
}
