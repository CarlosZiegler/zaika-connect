# Job Detail Page with Applications Kanban Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a job detail page with tabbed layout showing job info/stats and applications in table or kanban view with drag-drop status changes.

**Architecture:** New route `/admin/jobs/$jobId` with Tabs component. Overview tab shows stats + job info. Applications tab toggles between DataGridEnhanced table and existing Kanban component. ContextMenu for card actions.

**Tech Stack:** TanStack Router, React Query, ORPC, @dnd-kit (via existing Kanban), @base-ui Tabs/ContextMenu, Streamdown for markdown.

---

## Task 1: Add ORPC Endpoint for Job with Stats

**Files:**

- Modify: `src/orpc/routes/admin/jobs.ts`

**Step 1: Add getWithStats endpoint**

Add after the existing `get` procedure (around line 58):

```typescript
getWithStats: adminProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const jobResult = await context.db
      .select()
      .from(jobs)
      .where(eq(jobs.id, input.id))
      .limit(1);

    const job = jobResult.at(0);

    if (!job) {
      throw new ORPCError("NOT_FOUND", { message: "Job not found" });
    }

    const statsResult = await context.db
      .select({
        status: applications.status,
        count: sql<number>`cast(count(*) as int)`,
        avgScore: sql<number>`cast(avg(${applications.aiScore}) as int)`,
      })
      .from(applications)
      .where(eq(applications.jobId, input.id))
      .groupBy(applications.status);

    const stats = {
      total: 0,
      new: 0,
      reviewed: 0,
      shortlisted: 0,
      rejected: 0,
      avgScore: 0,
    };

    let totalScore = 0;
    let scoreCount = 0;

    for (const row of statsResult) {
      const count = Number(row.count);
      stats.total += count;
      stats[row.status as keyof typeof stats] = count;
      if (row.avgScore) {
        totalScore += row.avgScore * count;
        scoreCount += count;
      }
    }

    stats.avgScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

    return { job, stats };
  }),
```

**Step 2: Add import for applications and sql**

At top of file, update imports:

```typescript
import { desc, eq, sql } from "drizzle-orm";
import { applications, jobs } from "@/lib/db/schema";
```

**Step 3: Verify types**

Run: `bun x tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/orpc/routes/admin/jobs.ts
git commit -m "feat(orpc): add getWithStats endpoint for job detail"
```

---

## Task 2: Modify Jobs List to Include Application Count

**Files:**

- Modify: `src/orpc/routes/admin/jobs.ts`

**Step 1: Update list endpoint**

Replace the existing `list` handler:

```typescript
list: adminProcedure.handler(async ({ context }) => {
  const jobsList = await context.db
    .select({
      id: jobs.id,
      slug: jobs.slug,
      title: jobs.title,
      description: jobs.description,
      requirements: jobs.requirements,
      benefits: jobs.benefits,
      location: jobs.location,
      employmentType: jobs.employmentType,
      industry: jobs.industry,
      salaryMin: jobs.salaryMin,
      salaryMax: jobs.salaryMax,
      isActive: jobs.isActive,
      createdAt: jobs.createdAt,
      updatedAt: jobs.updatedAt,
      applicationCount: sql<number>`cast(count(${applications.id}) as int)`,
    })
    .from(jobs)
    .leftJoin(applications, eq(jobs.id, applications.jobId))
    .groupBy(jobs.id)
    .orderBy(desc(jobs.createdAt));

  return { jobs: jobsList };
}),
```

**Step 2: Commit**

```bash
git add src/orpc/routes/admin/jobs.ts
git commit -m "feat(orpc): add applicationCount to jobs list"
```

---

## Task 3: Update Jobs List Page with Links and Count Column

**Files:**

- Modify: `src/routes/(dashboard)/admin/jobs/index.tsx`

**Step 1: Add Link import**

Update imports at top:

```typescript
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
```

**Step 2: Add EyeIcon import**

```typescript
import {
  BriefcaseIcon,
  EyeIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from "lucide-react";
```

**Step 3: Update JobListItem type**

Add `applicationCount` field:

```typescript
type JobListItem = {
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
  applicationCount: number;
};
```

**Step 4: Update title column to be a link**

Replace the title column definition:

```typescript
{
  accessorKey: "title",
  header: t("ADMIN_JOBS_TABLE_TITLE"),
  cell: ({ row }) => (
    <div className="flex items-center gap-2">
      <BriefcaseIcon className="size-4 text-muted-foreground" />
      <Link
        to="/admin/jobs/$jobId"
        params={{ jobId: row.original.id }}
        className="font-medium text-primary hover:underline"
      >
        {row.original.title}
      </Link>
    </div>
  ),
},
```

**Step 5: Add applications count column**

Add after the industry column:

```typescript
{
  accessorKey: "applicationCount",
  header: "Apps",
  cell: ({ row }) => (
    <div className="flex items-center gap-2">
      <UsersIcon className="size-4 text-muted-foreground" />
      <span>{row.original.applicationCount}</span>
    </div>
  ),
},
```

**Step 6: Update JobActionsDropdown to include View Details**

```typescript
function JobActionsDropdown({
  job,
  onEdit,
  onDelete,
}: {
  job: JobListItem;
  onEdit: (job: JobListItem) => void;
  onDelete: (job: JobListItem) => void;
}) {
  const { t } = useTranslation();

  return (
    <TableActionsDropdown ariaLabel={t("ACTIONS")}>
      <DropdownMenuItem>
        <Link
          className="flex w-full items-center"
          to="/admin/jobs/$jobId"
          params={{ jobId: job.id }}
        >
          <EyeIcon className="mr-2 size-4" />
          View Details
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onEdit(job)}>
        <PencilIcon className="mr-2 size-4" />
        {t("EDIT")}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="text-destructive"
        onClick={() => onDelete(job)}
      >
        <TrashIcon className="mr-2 size-4" />
        {t("DELETE")}
      </DropdownMenuItem>
    </TableActionsDropdown>
  );
}
```

**Step 7: Commit**

```bash
git add src/routes/\(dashboard\)/admin/jobs/index.tsx
git commit -m "feat(admin): add job title links and apps count column"
```

---

## Task 4: Create Job Detail Route File

**Files:**

- Create: `src/routes/(dashboard)/admin/jobs/$jobId.tsx`

**Step 1: Create the route file**

```typescript
import { createFileRoute, redirect } from "@tanstack/react-router";

import { JobDetailPage } from "@/features/admin/job-detail/job-detail.page";
import { getUserWithAdmin } from "@/lib/auth/auth-server-fn";

export const Route = createFileRoute("/(dashboard)/admin/jobs/$jobId")({
  component: RouteComponent,
  beforeLoad: async () => {
    const { session, isAdmin } = await getUserWithAdmin();
    if (!isAdmin) {
      throw redirect({ to: "/overview" });
    }
    return { session };
  },
});

function RouteComponent() {
  return <JobDetailPage />;
}
```

**Step 2: Commit**

```bash
git add src/routes/\(dashboard\)/admin/jobs/\$jobId.tsx
git commit -m "feat(job-detail): add route file"
```

---

## Task 5: Create Job Detail Stats Component

**Files:**

- Create: `src/features/admin/job-detail/job-detail-stats.tsx`

**Step 1: Create the stats component**

```typescript
"use client";

import {
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  UsersIcon,
  XCircleIcon,
} from "lucide-react";

import { AIScoreBadge } from "@/components/ai-score-badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Stats = {
  total: number;
  new: number;
  reviewed: number;
  shortlisted: number;
  rejected: number;
  avgScore: number;
};

type JobDetailStatsProps = {
  stats: Stats;
  onStatClick?: (status: string | null) => void;
};

export function JobDetailStats({ stats, onStatClick }: JobDetailStatsProps) {
  const statItems = [
    {
      label: "Total",
      value: stats.total,
      icon: UsersIcon,
      color: "text-slate-600",
      bgColor: "bg-slate-100",
      status: null,
    },
    {
      label: "New",
      value: stats.new,
      icon: ClockIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      status: "new",
    },
    {
      label: "Reviewed",
      value: stats.reviewed,
      icon: EyeIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      status: "reviewed",
    },
    {
      label: "Shortlisted",
      value: stats.shortlisted,
      icon: CheckCircleIcon,
      color: "text-green-600",
      bgColor: "bg-green-100",
      status: "shortlisted",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      icon: XCircleIcon,
      color: "text-red-600",
      bgColor: "bg-red-100",
      status: "rejected",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {statItems.map((item) => (
        <Card
          key={item.label}
          className={cn(
            "cursor-pointer transition-shadow hover:shadow-md",
            onStatClick && "hover:ring-2 hover:ring-primary/20"
          )}
          onClick={() => onStatClick?.(item.status)}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <div className={cn("rounded-lg p-2", item.bgColor)}>
              <item.icon className={cn("size-5", item.color)} />
            </div>
            <div>
              <p className="font-semibold text-2xl">{item.value}</p>
              <p className="text-muted-foreground text-sm">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-lg bg-amber-100 p-2">
            <span className="font-bold text-amber-600 text-lg">AI</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <AIScoreBadge score={stats.avgScore} />
            </div>
            <p className="text-muted-foreground text-sm">Avg Score</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/features/admin/job-detail/job-detail-stats.tsx
git commit -m "feat(job-detail): add stats component"
```

---

## Task 6: Create Job Detail Overview Component

**Files:**

- Create: `src/features/admin/job-detail/job-detail-overview.tsx`

**Step 1: Create the overview component**

```typescript
"use client";

import {
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  DollarSignIcon,
  MapPinIcon,
  SparklesIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { MessageResponse } from "@/components/ai-elements/message";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Job = {
  id: string;
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
};

type JobDetailOverviewProps = {
  job: Job;
};

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  if (min && max) return `€${min.toLocaleString()} - €${max.toLocaleString()}`;
  if (min) return `From €${min.toLocaleString()}`;
  return `Up to €${max?.toLocaleString()}`;
}

export function JobDetailOverview({ job }: JobDetailOverviewProps) {
  const { t } = useTranslation();
  const salary = formatSalary(job.salaryMin, job.salaryMax);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Content */}
      <div className="space-y-6 lg:col-span-2">
        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SparklesIcon className="size-5 text-ocean-1" />
              About This Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <MessageResponse>{job.description}</MessageResponse>
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        {job.requirements ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BriefcaseIcon className="size-5 text-ocean-3" />
                Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <MessageResponse>{job.requirements}</MessageResponse>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Benefits */}
        {job.benefits ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SparklesIcon className="size-5 text-green-600" />
                Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <MessageResponse>{job.benefits}</MessageResponse>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPinIcon className="size-5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-sm">Location</p>
                <p className="font-medium">{job.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BriefcaseIcon className="size-5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-sm">Employment Type</p>
                <p className="font-medium">{job.employmentType}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BuildingIcon className="size-5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-sm">Industry</p>
                <p className="font-medium">{job.industry}</p>
              </div>
            </div>
            {salary ? (
              <div className="flex items-center gap-3">
                <DollarSignIcon className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-sm">Salary</p>
                  <p className="font-medium">{salary}</p>
                </div>
              </div>
            ) : null}
            <div className="flex items-center gap-3">
              <CalendarIcon className="size-5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-sm">Created</p>
                <p className="font-medium">
                  {new Date(job.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="pt-2">
              <Badge variant={job.isActive ? "default" : "secondary"}>
                {job.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/features/admin/job-detail/job-detail-overview.tsx
git commit -m "feat(job-detail): add overview component"
```

---

## Task 7: Create Application Kanban Card Component

**Files:**

- Create: `src/features/admin/job-detail/application-kanban-card.tsx`

**Step 1: Create the card component**

```typescript
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
import { cn } from "@/lib/utils";

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
  onDownloadCV?: (url: string) => void;
};

export function ApplicationKanbanCard({
  application,
  onQuickReject,
  onDownloadCV,
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
```

**Step 2: Commit**

```bash
git add src/features/admin/job-detail/application-kanban-card.tsx
git commit -m "feat(job-detail): add kanban card with context menu"
```

---

## Task 8: Create Application Kanban Board Component

**Files:**

- Create: `src/features/admin/job-detail/application-kanban.tsx`

**Step 1: Create the kanban board component**

```typescript
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

const STATUS_COLUMNS: { id: ApplicationStatus; label: string; color: string }[] = [
  { id: "new", label: "New", color: "bg-blue-500" },
  { id: "reviewed", label: "Reviewed", color: "bg-purple-500" },
  { id: "shortlisted", label: "Shortlisted", color: "bg-green-500" },
  { id: "rejected", label: "Rejected", color: "bg-red-500" },
];

export function ApplicationKanban({ applications, jobId }: ApplicationKanbanProps) {
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
          [currentColumn]: columns[currentColumn].filter((a) => a.id !== applicationId),
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
```

**Step 2: Commit**

```bash
git add src/features/admin/job-detail/application-kanban.tsx
git commit -m "feat(job-detail): add kanban board component"
```

---

## Task 9: Create Job Detail Applications Tab Component

**Files:**

- Create: `src/features/admin/job-detail/job-detail-applications.tsx`

**Step 1: Create the applications tab component**

```typescript
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
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus ?? "all");

  // Fetch applications for this job
  const { data, isLoading } = useQuery({
    ...orpc.admin.applications.list.queryOptions({
      input: {
        jobId,
        status: statusFilter === "all" ? undefined : statusFilter,
      },
    }),
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
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as "table" | "kanban")}
          >
            <ToggleGroupItem value="table" aria-label="Table view">
              <TableIcon className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="kanban" aria-label="Kanban view">
              <LayoutGridIcon className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          {viewMode === "table" && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
```

**Step 2: Commit**

```bash
git add src/features/admin/job-detail/job-detail-applications.tsx
git commit -m "feat(job-detail): add applications tab with table/kanban toggle"
```

---

## Task 10: Create Job Detail Main Page Component

**Files:**

- Create: `src/features/admin/job-detail/job-detail.page.tsx`

**Step 1: Create the main page component**

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type Job,
  type JobFormData,
  JobFormDialog,
} from "@/features/admin/job-form-dialog";
import { orpc } from "@/orpc/orpc-client";

import { JobDetailApplications } from "./job-detail-applications";
import { JobDetailOverview } from "./job-detail-overview";
import { JobDetailStats } from "./job-detail-stats";

export function JobDetailPage() {
  const { jobId } = useParams({ from: "/(dashboard)/admin/jobs/$jobId" });
  const [activeTab, setActiveTab] = useState("overview");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch job with stats
  const { data, isLoading, error } = useQuery({
    ...orpc.admin.jobs.getWithStats.queryOptions({
      input: { id: jobId },
    }),
  });

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
        <Button onClick={() => setIsEditDialogOpen(true)}>
          <PencilIcon className="mr-2 size-4" />
          Edit Job
        </Button>
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
          <JobDetailApplications
            jobId={jobId}
            initialStatus={statusFilter}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <JobFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        job={job as Job}
        onSubmit={(data) => {
          // Handle submit - will use existing mutation
          setIsEditDialogOpen(false);
        }}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/features/admin/job-detail/job-detail.page.tsx
git commit -m "feat(job-detail): add main page with tabs"
```

---

## Task 11: Create Index Export

**Files:**

- Create: `src/features/admin/job-detail/index.ts`

**Step 1: Create the index file**

```typescript
export { JobDetailPage } from "./job-detail.page";
export { JobDetailOverview } from "./job-detail-overview";
export { JobDetailApplications } from "./job-detail-applications";
export { JobDetailStats } from "./job-detail-stats";
export { ApplicationKanban } from "./application-kanban";
export { ApplicationKanbanCard } from "./application-kanban-card";
```

**Step 2: Commit**

```bash
git add src/features/admin/job-detail/index.ts
git commit -m "feat(job-detail): add index exports"
```

---

## Task 12: Add Edit Mutation to Job Detail Page

**Files:**

- Modify: `src/features/admin/job-detail/job-detail.page.tsx`

**Step 1: Add mutation imports and logic**

Update imports:

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { client, orpc } from "@/orpc/orpc-client";
```

Add inside the component before the return:

```typescript
const queryClient = useQueryClient();

// Update job mutation
const updateMutation = useMutation({
  mutationFn: (data: { id: string } & Partial<Omit<JobFormData, "autoSlug">>) =>
    client.admin.jobs.update(data),
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
    toast.error(error.message);
  },
});

const handleEditSubmit = (data: Omit<JobFormData, "autoSlug">) => {
  updateMutation.mutate({ id: jobId, ...data });
};
```

Update the JobFormDialog:

```typescript
<JobFormDialog
  open={isEditDialogOpen}
  onOpenChange={setIsEditDialogOpen}
  job={job as Job}
  onSubmit={handleEditSubmit}
  isPending={updateMutation.isPending}
/>
```

**Step 2: Commit**

```bash
git add src/features/admin/job-detail/job-detail.page.tsx
git commit -m "feat(job-detail): add edit mutation"
```

---

## Task 13: Verify and Test

**Step 1: Run type check**

Run: `bun x tsc --noEmit`
Expected: No errors

**Step 2: Run linter**

Run: `bun x ultracite check`
Expected: No errors (or fix with `bun x ultracite fix`)

**Step 3: Start dev server**

Run: `bun dev`

**Step 4: Test the feature**

Navigate to: `http://localhost:3000/dashboard/admin/jobs`

- [ ] Job titles are clickable links
- [ ] Apps count column shows
- [ ] View Details in action dropdown works
- [ ] Job detail page loads with stats
- [ ] Overview tab shows job info
- [ ] Applications tab shows table by default
- [ ] Toggle to Kanban view works
- [ ] Drag cards between columns updates status
- [ ] Context menu works (View, Copy Email, Quick Reject)
- [ ] Edit button opens modal and saves

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat(job-detail): complete implementation with kanban"
```

---

## Summary

| Task | Description                           |
| ---- | ------------------------------------- |
| 1    | ORPC getWithStats endpoint            |
| 2    | ORPC list with application count      |
| 3    | Jobs list page - links + count column |
| 4    | Route file                            |
| 5    | Stats component                       |
| 6    | Overview component                    |
| 7    | Kanban card component                 |
| 8    | Kanban board component                |
| 9    | Applications tab component            |
| 10   | Main page component                   |
| 11   | Index exports                         |
| 12   | Edit mutation                         |
| 13   | Verification and testing              |

Total: 13 tasks
