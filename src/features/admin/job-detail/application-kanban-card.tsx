"use client";

import { useNavigate } from "@tanstack/react-router";
import {
  ClipboardCopyIcon,
  DownloadIcon,
  EyeIcon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";

import { AIScoreBadge } from "@/components/ai-score-badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { KanbanItem, KanbanItemHandle } from "@/components/ui/kanban";
import { ProcessingStatusBadge } from "@/features/admin/applications/processing-status-badge";

type Application = {
  id: string;
  fullName: string;
  email: string;
  aiScore: number | null;
  createdAt: Date;
  cvUrl?: string | null;
  processingStatus: "pending" | "processing" | "completed" | "failed";
  processingError?: string | null;
};

type ApplicationKanbanCardProps = {
  application: Application;
  onQuickReject: (id: string) => void;
};

export function ApplicationKanbanCard({
  application,
  onQuickReject,
}: ApplicationKanbanCardProps) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate({
      to: "/admin/applications/$id",
      params: { id: application.id },
    });
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(application.email);
    toast.success("Email copied to clipboard");
  };

  const handleDownloadCV = () => {
    if (application.cvUrl) {
      window.open(application.cvUrl, "_blank");
    } else {
      toast.error("No CV available");
    }
  };

  const cardContent = (
    <div className="rounded-md border bg-card p-3 shadow-sm">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="line-clamp-1 font-medium text-sm">
            {application.fullName}
          </span>
          {application.processingStatus !== "completed" ? (
            <ProcessingStatusBadge
              status={application.processingStatus}
              error={application.processingError}
            />
          ) : (
            <AIScoreBadge score={application.aiScore} size="sm" />
          )}
        </div>
        <p className="line-clamp-1 text-muted-foreground text-xs">
          {application.email}
        </p>
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span className="text-[10px] tabular-nums">
            {new Date(application.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <KanbanItem value={application.id}>
      <ContextMenu>
        <ContextMenuTrigger>
          <KanbanItemHandle>{cardContent}</KanbanItemHandle>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleViewDetails}>
            <EyeIcon className="mr-2 size-4" />
            View Details
          </ContextMenuItem>
          <ContextMenuItem onClick={handleDownloadCV}>
            <DownloadIcon className="mr-2 size-4" />
            Download CV
          </ContextMenuItem>
          <ContextMenuItem onClick={handleCopyEmail}>
            <ClipboardCopyIcon className="mr-2 size-4" />
            Copy Email
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            variant="destructive"
            onClick={() => onQuickReject(application.id)}
          >
            <XCircleIcon className="mr-2 size-4" />
            Quick Reject
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </KanbanItem>
  );
}
