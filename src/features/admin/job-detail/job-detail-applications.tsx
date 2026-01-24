"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  CalendarIcon,
  EyeIcon,
  LayoutGridIcon,
  MailIcon,
  TableIcon,
  UserIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { CVAnalysis } from "@/lib/db/schema/recruiting";

import { AIScoreBadge } from "@/components/ai-score-badge";
import { TableActionsDropdown } from "@/components/table-actions-dropdown";
import { DataGridEnhanced } from "@/components/ui/data-grid-enhanced";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { client, orpc } from "@/orpc/orpc-client";

import { ApplicationKanban } from "./application-kanban";

type ApplicationStatus = "new" | "reviewed" | "shortlisted" | "rejected";

type ApplicationListItem = {
  id: string;
  jobId: string;
  fullName: string;
  email: string;
  phone: string | null;
  aiScore: number | null;
  aiAnalysis: CVAnalysis | null;
  status: string;
  processingStatus: "pending" | "processing" | "completed" | "failed";
  processingError?: string | null;
  createdAt: Date;
  cvUrl?: string | null;
};

type JobDetailApplicationsProps = {
  jobId: string;
  initialStatus?: string | null;
};

function getStatusColor(status: string): string {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-800";
    case "reviewed":
      return "bg-purple-100 text-purple-800";
    case "shortlisted":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function JobDetailApplications({
  jobId,
  initialStatus,
}: JobDetailApplicationsProps) {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [statusFilter, setStatusFilter] = useState<string>(
    initialStatus ?? "all"
  );

  // Fetch applications for this job
  const { data } = useQuery({
    ...orpc.admin.applications.list.queryOptions({
      input: {
        jobId,
        status: statusFilter === "all" ? undefined : statusFilter,
      },
    }),
    refetchInterval: (query) => {
      // Poll every 2s if any CV is pending/processing
      const hasProcessing = query.state.data?.applications.some(
        (app) =>
          app.processingStatus === "pending" ||
          app.processingStatus === "processing"
      );
      return hasProcessing ? 2000 : false;
    },
  });

  const applications = (data?.applications ?? []).map((item) => ({
    ...item,
    cvUrl: null, // Will be fetched when needed
  })) as ApplicationListItem[];

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: string; status: ApplicationStatus }) =>
      client.admin.applications.updateStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.admin.applications.list.queryOptions({
          input: { jobId },
        }).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: orpc.admin.jobs.getWithStats.queryOptions({
          input: { id: jobId },
        }).queryKey,
      });
      toast.success("Status updated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

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
      accessorKey: "aiScore",
      header: "AI Score",
      cell: ({ row }) => <AIScoreBadge score={row.original.aiScore} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Select
          disabled={updateStatusMutation.isPending}
          onValueChange={(value) =>
            updateStatusMutation.mutate({
              id: row.original.id,
              status: value as ApplicationStatus,
            })
          }
          value={row.original.status}
        >
          <SelectTrigger className="h-8 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["new", "reviewed", "shortlisted", "rejected"] as const).map(
              (status) => (
                <SelectItem key={status} value={status}>
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 font-medium text-xs ${getStatusColor(status)}`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Applied",
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
        <TableActionsDropdown ariaLabel="Actions">
          <DropdownMenuItem>
            <Link
              className="flex w-full items-center"
              to="/admin/applications/$id"
              params={{ id: row.original.id }}
            >
              <EyeIcon className="mr-2 size-4" />
              View Details
            </Link>
          </DropdownMenuItem>
        </TableActionsDropdown>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ToggleGroup
            value={[viewMode]}
            onValueChange={(values) => {
              if (values.length > 0) {
                setViewMode(values[0] as "table" | "kanban");
              }
            }}
            variant="outline"
          >
            <ToggleGroupItem value="table" aria-label="Table view">
              <TableIcon className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="kanban" aria-label="Kanban view">
              <LayoutGridIcon className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          {viewMode === "table" && (
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value ?? "all")}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Content */}
      {viewMode === "table" ? (
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
          />
          <DataGridEnhanced.Content emptyMessage="No applications found" />
          <DataGridEnhanced.Pagination showRowsPerPage={true} />
        </DataGridEnhanced>
      ) : (
        <ApplicationKanban applications={applications} jobId={jobId} />
      )}
    </div>
  );
}
