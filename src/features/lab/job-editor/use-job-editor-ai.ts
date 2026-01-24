"use client";

import { useCallback } from "react";

type AIAction =
  | "generate"
  | "improve"
  | "format"
  | "add-section"
  | "shorter"
  | "longer";

type UseJobEditorAIProps = {
  description: string;
  jobTitle: string;
  onDescriptionChange: (value: string) => void;
  setIsStreaming: (value: boolean) => void;
};

export function useJobEditorAI({
  description,
  jobTitle,
  onDescriptionChange,
  setIsStreaming,
}: UseJobEditorAIProps) {
  const runAction = useCallback(
    async (action: AIAction, sectionType?: string) => {
      setIsStreaming(true);

      try {
        const response = await fetch("/api/ai/job-description", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            description,
            jobTitle,
            sectionType,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();

        // For add-section, prepend existing description
        let result = action === "add-section" ? `${description}\n\n` : "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          result += chunk;
          onDescriptionChange(result);
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [description, jobTitle, onDescriptionChange, setIsStreaming]
  );

  return { runAction };
}
