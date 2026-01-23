import type { ColumnDef } from "@tanstack/react-table";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  CalendarIcon,
  EyeIcon,
  FileTextIcon,
  MailIcon,
  UserIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import type { CVAnalysis } from "@/lib/db/schema/recruiting";

import { AIScoreBadge } from "@/components/ai-score-badge";
import { TableActionsDropdown } from "@/components/table-actions-dropdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataGridEnhanced } from "@/components/ui/data-grid-enhanced";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { isAdminEmail } from "@/lib/auth/admin-check";
import { authQueryOptions } from "@/lib/auth/queries";
import { client, orpc } from "@/orpc/orpc-client";

export const Route = createFileRoute("/(dashboard)/admin/applications/")({
  component: AdminApplicationsPage,
  beforeLoad: async ({ context }) => {
    const session =
      await context.queryClient.ensureQueryData(authQueryOptions());
    if (!isAdminEmail(session?.user?.email)) {
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

type ApplicationListItem = {
  id: string;
  jobId: string;
  fullName: string;
  email: string;
  phone: string | null;
  message: string | null;
  cvFileId: string | null;
  cvFileKey: string | null;
  aiScore: number | null;
  aiAnalysis: CVAnalysis | null;
  status: string;
  createdAt: Date;
  job: {
    id: string;
    slug: string;
    title: string;
    description: string;
    requirements: string | null;
    benefits: string | null;
    location: string;
    employmentType: string;
    industry: string;
    salaryMin: number | null;
    salaryMax: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } | null;
};

function StatusDropdown({
  application,
  onStatusChange,
  isPending,
}: {
  application: ApplicationListItem;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  isPending: boolean;
}) {
  const { t } = useTranslation();
  const statuses: ApplicationStatus[] = [
    "new",
    "reviewed",
    "shortlisted",
    "rejected",
  ];

  return (
    <Select
      disabled={isPending}
      onValueChange={(value) =>
        onStatusChange(application.id, value as ApplicationStatus)
      }
      value={application.status}
    >
      <SelectTrigger className="h-8 w-32">
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
  );
}

function ApplicationActionsDropdown({
  application,
}: {
  application: ApplicationListItem;
}) {
  const { t } = useTranslation();

  return (
    <TableActionsDropdown ariaLabel={t("ACTIONS")}>
      <DropdownMenuItem>
        <Link
          className="flex w-full items-center"
          to="/admin/applications/$id"
          params={{ id: application.id }}
        >
          <EyeIcon className="mr-2 size-4" />
          View Details
        </Link>
      </DropdownMenuItem>
    </TableActionsDropdown>
  );
}

function AdminApplicationsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch jobs for filter dropdown
  const { data: jobsData } = useQuery(orpc.admin.jobs.list.queryOptions());
  const jobs = jobsData?.jobs ?? [];

  // Fetch applications
  const { data, isLoading } = useQuery({
    ...orpc.admin.applications.list.queryOptions({
      input: {
        jobId: jobFilter === "all" ? undefined : jobFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
      },
    }),
  });

  const applications = (data?.applications ?? []) as ApplicationListItem[];

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: string; status: ApplicationStatus }) =>
      client.admin.applications.updateStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.admin.applications.list.queryOptions({
          input: {
            jobId: jobFilter === "all" ? undefined : jobFilter,
            status: statusFilter === "all" ? undefined : statusFilter,
          },
        }).queryKey,
      });
      toast.success("Status updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleStatusChange = (id: string, status: ApplicationStatus) => {
    updateStatusMutation.mutate({ id, status });
  };

  const columns: ColumnDef<ApplicationListItem>[] = [
    {
      accessorKey: "fullName",
      header: "Candidate",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <UserIcon className="size-4 text-muted-foreground" />
          <span className="font-medium">{row.original.fullName}</span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MailIcon className="size-4 text-muted-foreground" />
          <span className="text-sm">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: "job.title",
      header: "Job",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileTextIcon className="size-4 text-muted-foreground" />
          <span className="text-sm">{row.original.job?.title ?? "N/A"}</span>
        </div>
      ),
    },
    {
      accessorKey: "aiScore",
      header: t("ADMIN_APPLICATION_SCORE"),
      cell: ({ row }) => <AIScoreBadge score={row.original.aiScore} />,
    },
    {
      accessorKey: "status",
      header: t("ADMIN_APPLICATION_STATUS"),
      cell: ({ row }) => (
        <StatusDropdown
          application={row.original}
          isPending={updateStatusMutation.isPending}
          onStatusChange={handleStatusChange}
        />
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <CalendarIcon className="size-4 text-muted-foreground" />
          <span className="text-sm">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <ApplicationActionsDropdown application={row.original} />
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-2xl tracking-tight">
            {t("ADMIN_APPLICATIONS_TITLE")}
          </h2>
          <p className="text-muted-foreground">
            Review and manage job applications.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-medium text-lg">
            {t("ADMIN_APPLICATIONS_TITLE")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 && !jobFilter && !statusFilter ? (
            <div className="py-12 text-center">
              <FileTextIcon className="mx-auto size-12 text-muted-foreground" />
              <h3 className="mt-4 font-medium text-lg">
                {t("ADMIN_APPLICATIONS_EMPTY")}
              </h3>
            </div>
          ) : (
            <DataGridEnhanced
              columns={columns}
              data={applications}
              enableRowSelection={false}
              getRowId={(row) => row.id}
              initialPageSize={10}
            >
              <DataGridEnhanced.Toolbar
                searchColumn="fullName"
                searchPlaceholder="Search candidates..."
                searchable={true}
                showColumnVisibility={true}
              >
                <Select
                  onValueChange={(value) => setJobFilter(value ?? "all")}
                  value={jobFilter}
                >
                  <SelectTrigger className="h-9 w-48">
                    <SelectValue placeholder="Filter by job" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobs</SelectItem>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  onValueChange={(value) => setStatusFilter(value ?? "all")}
                  value={statusFilter}
                >
                  <SelectTrigger className="h-9 w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">
                      {t("ADMIN_APPLICATION_STATUS_NEW")}
                    </SelectItem>
                    <SelectItem value="reviewed">
                      {t("ADMIN_APPLICATION_STATUS_REVIEWED")}
                    </SelectItem>
                    <SelectItem value="shortlisted">
                      {t("ADMIN_APPLICATION_STATUS_SHORTLISTED")}
                    </SelectItem>
                    <SelectItem value="rejected">
                      {t("ADMIN_APPLICATION_STATUS_REJECTED")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </DataGridEnhanced.Toolbar>
              <DataGridEnhanced.Content
                emptyMessage={t("ADMIN_APPLICATIONS_EMPTY")}
              />
              <DataGridEnhanced.Pagination showRowsPerPage={true} />
            </DataGridEnhanced>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
