"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProcessPendingButton } from "@/features/admin/applications/process-pending-button";
import {
  type Job,
  type JobFormData,
  JobFormDialog,
} from "@/features/admin/job-form-dialog";
import { client, orpc } from "@/orpc/orpc-client";
import { useORPCErrorMessage } from "@/orpc/use-orpc-error-message";

import { JobDetailApplications } from "./job-detail-applications";
import { JobDetailOverview } from "./job-detail-overview";
import { JobDetailStats } from "./job-detail-stats";

export function JobDetailPage() {
  const { jobId } = useParams({ from: "/(dashboard)/admin/jobs/$jobId" });
  const [activeTab, setActiveTab] = useState("overview");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { getMessage } = useORPCErrorMessage();

  // Fetch job with stats
  const { data, isLoading, error } = useQuery({
    ...orpc.admin.jobs.getWithStats.queryOptions({
      input: { id: jobId },
    }),
  });

  // Update job mutation
  const updateMutation = useMutation({
    mutationFn: (
      data: { id: string } & Partial<Omit<JobFormData, "autoSlug">>
    ) => client.admin.jobs.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.admin.jobs.getWithStats.queryOptions({
          input: { id: jobId },
        }).queryKey,
      });
      toast.success("Job updated successfully");
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(getMessage(error));
    },
  });

  const handleEditSubmit = (data: Omit<JobFormData, "autoSlug">) => {
    updateMutation.mutate({ id: jobId, ...data });
  };

  const handleStatClick = (status: string | null) => {
    setStatusFilter(status);
    setActiveTab("applications");
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error || !data?.job) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Job not found</p>
        <Link to="/admin/jobs">
          <Button variant="outline">
            <ArrowLeftIcon className="mr-2 size-4" />
            Back to Jobs
          </Button>
        </Link>
      </div>
    );
  }

  const { job, stats } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/jobs">
            <Button variant="ghost" size="icon">
              <ArrowLeftIcon className="size-5" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold text-2xl">{job.title}</h1>
            <p className="text-muted-foreground">
              {job.location} · {job.employmentType}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ProcessPendingButton />
          <Button onClick={() => setIsEditDialogOpen(true)}>
            <PencilIcon className="mr-2 size-4" />
            Edit Job
          </Button>
        </div>
      </div>

      {/* Stats */}
      <JobDetailStats stats={stats} onStatClick={handleStatClick} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">
            Applications ({stats.total})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <JobDetailOverview job={job} />
        </TabsContent>
        <TabsContent value="applications" className="mt-6">
          <JobDetailApplications jobId={jobId} initialStatus={statusFilter} />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <JobFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        job={job as Job}
        onSubmit={handleEditSubmit}
        isPending={updateMutation.isPending}
      />
    </div>
  );
}
