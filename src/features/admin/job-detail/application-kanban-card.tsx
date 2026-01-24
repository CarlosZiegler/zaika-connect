"use client";

import { useNavigate } from "@tanstack/react-router";
import {
  ClipboardCopyIcon,
  DownloadIcon,
  EyeIcon,
  GripVerticalIcon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";

import { AIScoreBadge } from "@/components/ai-score-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { KanbanItem, KanbanItemHandle } from "@/components/ui/kanban";

type Application = {
  id: string;
  fullName: string;
  email: string;
  aiScore: number | null;
  createdAt: Date;
  cvUrl?: string | null;
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

  return (
    <KanbanItem value={application.id}>
      <ContextMenu>
        <ContextMenuTrigger>
          <Card className="cursor-grab transition-shadow hover:shadow-md active:cursor-grabbing">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <KanbanItemHandle>
                  <GripVerticalIcon className="size-4 text-muted-foreground" />
                </KanbanItemHandle>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{application.fullName}</p>
                  <p className="truncate text-muted-foreground text-sm">
                    {application.email}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </span>
                    <AIScoreBadge score={application.aiScore} size="sm" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
