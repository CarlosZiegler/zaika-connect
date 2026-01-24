"use client";

import { Eye, MoreVertical, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/lib/format-date";

interface RecentApplication {
  id: string;
  fullName: string;
  email: string;
  jobId: string;
  jobTitle: string;
  aiScore: number | null;
  status: string;
  createdAt: string;
}

interface DashboardRecentTableProps {
  applications: RecentApplication[];
}

function getAiScoreBadgeVariant(
  score: number | null
): "default" | "secondary" | "destructive" {
  if (score === null) return "secondary";
  if (score >= 70) return "default";
  if (score >= 50) return "secondary";
  return "destructive";
}

function getStatusBadgeVariant(
  status: string
): "default" | "destructive" | "outline" | "secondary" {
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus === "new") return "outline";
  if (normalizedStatus === "reviewed") return "secondary";
  if (normalizedStatus === "shortlisted") return "default";
  if (normalizedStatus === "rejected") return "destructive";
  return "secondary";
}

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function DashboardRecentTable({
  applications,
}: DashboardRecentTableProps) {
  const isEmpty = applications.length === 0;

  return (
    <Card className="@container/card flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Latest applications received</CardDescription>
          </div>
          <a href="/admin/applications">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </a>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden px-4 pb-4">
        {isEmpty ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No applications yet
          </div>
        ) : (
          <div className="h-[300px] space-y-2 overflow-y-auto pr-2">
            {applications.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between rounded-lg border border-[#006466]/20 bg-[#006466]/5 p-3 transition-colors hover:bg-[#006466]/10"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{app.fullName}</span>
                    <Badge
                      variant={getAiScoreBadgeVariant(app.aiScore)}
                      className="shrink-0 bg-depth-5 text-white"
                    >
                      {app.aiScore !== null ? app.aiScore : "—"}
                    </Badge>
                    <Badge
                      variant={getStatusBadgeVariant(app.status)}
                      className="shrink-0 bg-depth-5 text-white"
                    >
                      {formatStatus(app.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <span className="truncate">{app.jobTitle}</span>
                    <span className="shrink-0">•</span>
                    <span className="shrink-0">
                      {formatRelativeTime(app.createdAt)}
                    </span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button
                      aria-label={`Actions for ${app.fullName}`}
                      className="ml-2 h-8 w-8 shrink-0"
                      size="icon"
                      variant="ghost"
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 size-4" />
                      View CV
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive">
                      <X className="mr-2 size-4" />
                      Reject
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
