"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanOverlay,
  type KanbanMoveEvent,
} from "@/components/ui/kanban";
import { client, orpc } from "@/orpc/orpc-client";

import { ApplicationKanbanCard } from "./application-kanban-card";

type ApplicationStatus = "new" | "reviewed" | "shortlisted" | "rejected";

type Application = {
  id: string;
  fullName: string;
  email: string;
  aiScore: number | null;
  status: string;
  createdAt: Date;
  cvUrl?: string | null;
};

type ApplicationKanbanProps = {
  applications: Application[];
  jobId: string;
};

const STATUS_COLUMNS: {
  id: ApplicationStatus;
  label: string;
  color: string;
}[] = [
  { id: "new", label: "New", color: "bg-blue-500" },
  { id: "reviewed", label: "Reviewed", color: "bg-purple-500" },
  { id: "shortlisted", label: "Shortlisted", color: "bg-green-500" },
  { id: "rejected", label: "Rejected", color: "bg-red-500" },
];

export function ApplicationKanban({
  applications,
  jobId,
}: ApplicationKanbanProps) {
  const queryClient = useQueryClient();

  // Group applications by status
  const initialColumns = useMemo(() => {
    const columns: Record<string, Application[]> = {
      new: [],
      reviewed: [],
      shortlisted: [],
      rejected: [],
    };

    for (const app of applications) {
      if (columns[app.status]) {
        columns[app.status].push(app);
      }
    }

    return columns;
  }, [applications]);

  const [columns, setColumns] = useState(initialColumns);

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
    },
    onError: (error) => {
      toast.error(error.message);
      // Revert on error
      setColumns(initialColumns);
    },
  });

  const handleMove = (event: KanbanMoveEvent) => {
    const { activeContainer, overContainer } = event;

    if (activeContainer === overContainer) return;

    const itemId = event.event.active.id as string;
    const newStatus = overContainer as ApplicationStatus;

    // Optimistic update already handled by Kanban component
    // Just trigger the mutation
    updateStatusMutation.mutate({ id: itemId, status: newStatus });
    toast.success(`Status updated to ${newStatus}`);
  };

  const handleQuickReject = (applicationId: string) => {
    // Find current column
    let currentColumn: string | null = null;
    for (const [col, apps] of Object.entries(columns)) {
      if (apps.some((a) => a.id === applicationId)) {
        currentColumn = col;
        break;
      }
    }

    if (currentColumn && currentColumn !== "rejected") {
      const app = columns[currentColumn].find((a) => a.id === applicationId);
      if (app) {
        // Optimistic update
        setColumns({
          ...columns,
          [currentColumn]: columns[currentColumn].filter(
            (a) => a.id !== applicationId
          ),
          rejected: [...columns.rejected, app],
        });

        updateStatusMutation.mutate({ id: applicationId, status: "rejected" });
        toast.success("Application rejected");
      }
    }
  };

  return (
    <Kanban
      value={columns}
      onValueChange={setColumns}
      getItemValue={(item) => item.id}
      onMove={handleMove}
    >
      <KanbanBoard className="grid-cols-4">
        {STATUS_COLUMNS.map((column) => (
          <KanbanColumn key={column.id} value={column.id}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`size-3 rounded-full ${column.color}`} />
                <span className="font-medium">{column.label}</span>
              </div>
              <Badge variant="secondary">{columns[column.id].length}</Badge>
            </div>
            <KanbanColumnContent
              value={column.id}
              className="min-h-[200px] rounded-lg bg-muted/50 p-2"
            >
              {columns[column.id].map((app) => (
                <ApplicationKanbanCard
                  key={app.id}
                  application={app}
                  onQuickReject={handleQuickReject}
                />
              ))}
            </KanbanColumnContent>
          </KanbanColumn>
        ))}
      </KanbanBoard>
      <KanbanOverlay>
        {({ value }) => {
          const app = applications.find((a) => a.id === value);
          if (!app) return null;
          return (
            <div className="rounded-lg border bg-background p-3 shadow-lg">
              <p className="font-medium">{app.fullName}</p>
              <p className="text-muted-foreground text-sm">{app.email}</p>
            </div>
          );
        }}
      </KanbanOverlay>
    </Kanban>
  );
}
