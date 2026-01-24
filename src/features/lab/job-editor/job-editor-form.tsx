"use client";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type JobEditorFormProps = {
  description: string;
  onDescriptionChange: (value: string) => void;
  disabled?: boolean;
};

export function JobEditorForm({
  description,
  onDescriptionChange,
  disabled = false,
}: JobEditorFormProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <label htmlFor="job-description" className="font-medium text-sm">
        Description (Markdown)
      </label>
      <Textarea
        id="job-description"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Write your job description using markdown..."
        className={cn(
          "min-h-0 flex-1 resize-none font-mono text-sm",
          disabled && "opacity-50"
        )}
        disabled={disabled}
      />
    </div>
  );
}
