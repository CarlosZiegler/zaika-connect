"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileTextIcon, MessageSquareIcon, RotateCcwIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { client, orpc } from "@/orpc/orpc-client";

import { JobEditorActions } from "./job-editor-actions";
import { JobEditorForm } from "./job-editor-form";
import { JobEditorPreview } from "./job-editor-preview";
import { SlidingChatPanel } from "./sliding-chat-panel";

export function JobEditorPage() {
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [initialDescription, setInitialDescription] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const queryClient = useQueryClient();

  // Fetch jobs list
  const { data, isLoading: isLoadingJobs } = useQuery(
    orpc.admin.jobs.list.queryOptions()
  );
  const jobs = data?.jobs ?? [];

  // Save mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: string; description: string }) =>
      client.admin.jobs.update(data),
    onSuccess: () => {
      // Invalidate all job-related queries to ensure fresh data everywhere
      queryClient.invalidateQueries({
        queryKey: orpc.admin.jobs.list.queryOptions().queryKey,
      });
      if (selectedJobId) {
        queryClient.invalidateQueries({
          queryKey: orpc.admin.jobs.getWithStats.queryOptions({
            input: { id: selectedJobId },
          }).queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: orpc.admin.jobs.get.queryOptions({
            input: { id: selectedJobId },
          }).queryKey,
        });
      }
      toast.success("Job description saved");
      setInitialDescription(description);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSave = () => {
    if (!selectedJobId) return;
    updateMutation.mutate({ id: selectedJobId, description });
  };

  // Load selected job
  const selectedJob = jobs.find((job) => job.id === selectedJobId);

  const handleJobSelect = (jobId: string | null) => {
    if (!jobId) return;
    setSelectedJobId(jobId);
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      setDescription(job.description);
      setInitialDescription(job.description);
    }
  };

  const handleReset = () => {
    setDescription(initialDescription);
  };

  const hasChanges = description !== initialDescription;

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="flex items-center gap-2 font-semibold text-xl">
            <FileTextIcon className="size-5" />
            Job Description Editor
          </h1>
          <Select value={selectedJobId} onValueChange={handleJobSelect}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a job to edit..." />
            </SelectTrigger>
            <SelectContent>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedJob && (
            <span className="font-medium text-muted-foreground">
              Editing: {selectedJob.title}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant={chatOpen ? "default" : "outline"}
            onClick={() => setChatOpen(!chatOpen)}
            disabled={!selectedJobId}
          >
            <MessageSquareIcon className="mr-2 size-4" />
            {chatOpen ? "Close Chat" : "AI Chat"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges}
          >
            <RotateCcwIcon className="mr-2 size-4" />
            Reset
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || !selectedJobId || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Spinner className="mr-2 size-4" />
                Saving...
              </>
            ) : (
              "Save Job"
            )}
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex min-h-0 flex-1">
        {/* Main Content - shrinks when chat opens */}
        <div className="flex min-h-0 flex-1 transition-all duration-300 ease-in-out">
          {isLoadingJobs ? (
            <div className="flex flex-1 items-center justify-center">
              <Spinner className="size-8" />
            </div>
          ) : !selectedJobId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground">
              <FileTextIcon className="size-12" />
              <p>Select a job to start editing</p>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1">
              {/* Editor Panel - 60% */}
              <div className="flex w-3/5 flex-col border-r p-6">
                <JobEditorActions
                  description={description}
                  jobTitle={selectedJob?.title ?? ""}
                  onDescriptionChange={setDescription}
                  isStreaming={isStreaming}
                  setIsStreaming={setIsStreaming}
                />
                <JobEditorForm
                  description={description}
                  onDescriptionChange={setDescription}
                  disabled={isStreaming}
                />
              </div>

              {/* Preview Panel - 40% */}
              <div className="w-2/5 overflow-y-auto bg-slate-50 p-6">
                <JobEditorPreview description={description} job={selectedJob} />
              </div>
            </div>
          )}
        </div>

        {/* Sliding Chat Panel - 25% */}
        <SlidingChatPanel
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          description={description}
          jobTitle={selectedJob?.title ?? ""}
          onDescriptionChange={setDescription}
        />
      </div>
    </div>
  );
}
