"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Snippet } from "../types";

type SnippetSelectProps = {
  snippets: Snippet[];
  value: string | null;
  onChange: (snippetId: string) => void;
};

export function SnippetSelect({
  snippets,
  value,
  onChange,
}: SnippetSelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Snippet</label>
      <Select value={value ?? ""} onValueChange={(v) => v && onChange(v)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select snippet" />
        </SelectTrigger>
        <SelectContent>
          {snippets.map((snippet) => (
            <SelectItem key={snippet.id} value={snippet.id}>
              {snippet.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && (
        <p className="text-xs text-muted-foreground">
          {snippets.find((s) => s.id === value)?.description}
        </p>
      )}
    </div>
  );
}
