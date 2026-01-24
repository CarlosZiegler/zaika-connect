// src/lib/cv/cv-extractor.ts
import { openai } from "@ai-sdk/openai";
import { Output, generateText } from "ai";

import { type CVExtraction, cvExtractionSchema } from "./cv-types";

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

export async function extractCvText(input: {
  fileDataUrl: string;
  mediaType: string;
}): Promise<CVExtraction> {
  const dataUrl = await toDataUrl({
    fileDataUrl: input.fileDataUrl,
    mediaType: input.mediaType,
  });

  const { experimental_output: output } = await generateText({
    model: openai("gpt-4o"),
    experimental_output: Output.object({ schema: cvExtractionSchema }),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extract all text and analyze this CV/Resume.

**Instructions:**
1. Extract ALL readable text content from the document
2. Identify all technical and soft skills mentioned
3. Estimate years of professional experience from work history
4. Identify the highest education level
5. List 3-5 key strengths
6. List 3-5 areas for improvement

Return complete, accurate text extraction. The fullText field should contain ALL text from the CV.`,
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
    throw new Error("Failed to extract CV - no output from AI");
  }

  return output;
}
