import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  CalendarIcon,
  DownloadIcon,
  MailIcon,
  MessageSquareIcon,
  PhoneIcon,
  UserIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { AIAnalysisPanel } from "@/components/ai-analysis-panel";
import { AIScoreBadge } from "@/components/ai-score-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { getUserWithAdmin } from "@/lib/auth/auth-server-fn";
import { client, orpc } from "@/orpc/orpc-client";

export const Route = createFileRoute("/(dashboard)/admin/applications/$id")({
  component: AdminApplicationDetailPage,
  beforeLoad: async () => {
    const { session, isAdmin } = await getUserWithAdmin();
    if (!isAdmin) {
      throw redirect({ to: "/overview" });
    }
    return { session };
  },
});

type ApplicationStatus = "new" | "reviewed" | "shortlisted" | "rejected";

type StatusKey =
  | "ADMIN_APPLICATION_STATUS_NEW"
  | "ADMIN_APPLICATION_STATUS_REVIEWED"
  | "ADMIN_APPLICATION_STATUS_SHORTLISTED"
  | "ADMIN_APPLICATION_STATUS_REJECTED";

function getStatusKey(status: string): StatusKey {
  return `ADMIN_APPLICATION_STATUS_${status.toUpperCase()}` as StatusKey;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "new": {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    }
    case "reviewed": {
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    }
    case "shortlisted": {
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    }
    case "rejected": {
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    }
    default: {
      return "bg-muted text-muted-foreground";
    }
  }
}

function AdminApplicationDetailPage() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  const {
    data: application,
    isLoading,
    error,
  } = useQuery({
    ...orpc.admin.applications.get.queryOptions({
      input: { id },
    }),
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: string; status: ApplicationStatus }) =>
      client.admin.applications.updateStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.admin.applications.get.queryOptions({
          input: { id },
        }).queryKey,
      });
      toast.success("Status updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleStatusChange = (status: ApplicationStatus) => {
    updateStatusMutation.mutate({ id, status });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="py-12 text-center">
        <h2 className="font-bold text-2xl">{t("NOT_FOUND_TITLE")}</h2>
        <p className="mt-2 text-muted-foreground">{t("NOT_FOUND_DESC")}</p>
        <Link to="/admin/applications">
          <Button className="mt-4" type="button" variant="outline">
            <ArrowLeftIcon className="mr-2 size-4" />
            Back to Applications
          </Button>
        </Link>
      </div>
    );
  }

  const statuses: ApplicationStatus[] = [
    "new",
    "reviewed",
    "shortlisted",
    "rejected",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/applications">
            <Button size="icon" type="button" variant="ghost">
              <ArrowLeftIcon className="size-4" />
              <span className="sr-only">Back to Applications</span>
            </Button>
          </Link>
          <div>
            <h2 className="font-semibold text-2xl tracking-tight">
              {application.fullName}
            </h2>
            <p className="text-muted-foreground">
              Application for {application.job?.title ?? "Unknown Position"}
            </p>
          </div>
        </div>
        <AIScoreBadge score={application.aiScore} size="lg" showLabel />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Candidate Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Candidate Information</span>
              <Select
                disabled={updateStatusMutation.isPending}
                onValueChange={(value) =>
                  handleStatusChange(value as ApplicationStatus)
                }
                value={application.status}
              >
                <SelectTrigger className="h-9 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 font-medium text-xs ${getStatusColor(status)}`}
                      >
                        {t(getStatusKey(status))}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <UserIcon className="size-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{application.fullName}</p>
                <p className="text-muted-foreground text-sm">Full Name</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MailIcon className="size-5 text-muted-foreground" />
              <div>
                <a
                  className="font-medium hover:underline"
                  href={`mailto:${application.email}`}
                >
                  {application.email}
                </a>
                <p className="text-muted-foreground text-sm">Email</p>
              </div>
            </div>

            {application.phone ? (
              <div className="flex items-center gap-3">
                <PhoneIcon className="size-5 text-muted-foreground" />
                <div>
                  <a
                    className="font-medium hover:underline"
                    href={`tel:${application.phone}`}
                  >
                    {application.phone}
                  </a>
                  <p className="text-muted-foreground text-sm">Phone</p>
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-3">
              <CalendarIcon className="size-5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {new Date(application.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-muted-foreground text-sm">Applied On</p>
              </div>
            </div>

            {application.job ? (
              <div className="flex items-center gap-3">
                <BriefcaseIcon className="size-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{application.job.title}</p>
                  <p className="text-muted-foreground text-sm">Position</p>
                </div>
              </div>
            ) : null}

            {application.cvUrl ? (
              <div className="pt-4">
                <a
                  download
                  href={application.cvUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Button className="w-full" type="button" variant="outline">
                    <DownloadIcon className="mr-2 size-4" />
                    {t("ADMIN_APPLICATION_DOWNLOAD_CV")}
                  </Button>
                </a>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Cover Letter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareIcon className="size-5" />
              Cover Letter
            </CardTitle>
          </CardHeader>
          <CardContent>
            {application.message ? (
              <p className="whitespace-pre-wrap text-muted-foreground text-sm">
                {application.message}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                No cover letter provided.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Panel */}
      <AIAnalysisPanel analysis={application.aiAnalysis} />

      {/* Additional Info from AI Analysis */}
      {application.aiAnalysis ? (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Strengths */}
          {application.aiAnalysis.strengths &&
          application.aiAnalysis.strengths.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">CV Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-inside list-disc space-y-1 text-muted-foreground text-sm">
                  {application.aiAnalysis.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {/* Extracted Skills */}
          {application.aiAnalysis.extractedSkills &&
          application.aiAnalysis.extractedSkills.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  All Extracted Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {application.aiAnalysis.extractedSkills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
