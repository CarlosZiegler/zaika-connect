"use client";

import { SparklesIcon } from "lucide-react";

import { MessageResponse } from "@/components/ai-elements/message";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Job = {
  id: string;
  title: string;
  description: string;
  location: string;
  employmentType: string;
  industry: string;
};

type JobEditorPreviewProps = {
  description: string;
  job?: Job | null;
};

export function JobEditorPreview({ description, job }: JobEditorPreviewProps) {
  if (!job) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="text-muted-foreground text-sm">
        Preview: How users will see this on the Job Details page
      </div>

      {/* About Section - mirrors job-detail.tsx */}
      <Card className="overflow-hidden border-slate-100 bg-white shadow-md">
        <div className="h-1 bg-ocean-1" />
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl text-depth-1">
            <div className="flex size-8 items-center justify-center rounded-lg bg-ocean-1/10 text-ocean-1">
              <SparklesIcon className="size-4" aria-hidden="true" />
            </div>
            About This Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none text-slate-600">
            <MessageResponse>{description}</MessageResponse>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
