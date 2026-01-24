"use client";

import {
  FileTextIcon,
  MaximizeIcon,
  MinimizeIcon,
  PlusIcon,
  SparklesIcon,
  WandIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useJobEditorAI } from "./use-job-editor-ai";

type JobEditorActionsProps = {
  description: string;
  jobTitle: string;
  onDescriptionChange: (value: string) => void;
  isStreaming: boolean;
  setIsStreaming: (value: boolean) => void;
};

export function JobEditorActions({
  description,
  jobTitle,
  onDescriptionChange,
  isStreaming,
  setIsStreaming,
}: JobEditorActionsProps) {
  const { runAction } = useJobEditorAI({
    description,
    jobTitle,
    onDescriptionChange,
    setIsStreaming,
  });

  const hasDescription = description.trim().length > 0;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => runAction("generate")}
        disabled={isStreaming || !jobTitle}
      >
        <SparklesIcon className="mr-2 size-4" />
        Generate
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => runAction("improve")}
        disabled={isStreaming || !hasDescription}
      >
        <WandIcon className="mr-2 size-4" />
        Improve
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => runAction("format")}
        disabled={isStreaming || !hasDescription}
      >
        <FileTextIcon className="mr-2 size-4" />
        Format MD
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isStreaming || !hasDescription}
          >
            <PlusIcon className="mr-2 size-4" />
            Add Section
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onSelect={() => runAction("add-section", "requirements")}
          >
            Requirements
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => runAction("add-section", "benefits")}
          >
            Benefits
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => runAction("add-section", "about-company")}
          >
            About Company
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => runAction("add-section", "responsibilities")}
          >
            Responsibilities
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => runAction("shorter")}
        disabled={isStreaming || !hasDescription}
      >
        <MinimizeIcon className="mr-2 size-4" />
        Shorter
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => runAction("longer")}
        disabled={isStreaming || !hasDescription}
      >
        <MaximizeIcon className="mr-2 size-4" />
        Longer
      </Button>
    </div>
  );
}
