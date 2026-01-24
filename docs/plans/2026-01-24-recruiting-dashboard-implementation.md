# Recruiting Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace generic demo overview page with recruiting-focused dashboard showing real metrics from jobs and applications data.

**Architecture:** Single ORPC endpoint returns all dashboard data (stats, charts, recent activity). Frontend components fetch once and display. Period stored in URL params for shareability.

**Tech Stack:** ORPC + Drizzle ORM for API, TanStack Query for fetching, Recharts + shadcn charts for visualization, existing date utilities.

---

## Task 1: Create Dashboard Stats ORPC Endpoint

**Files:**

- Create: `src/orpc/routes/admin/dashboard.ts`
- Modify: `src/orpc/index.ts:21-25` - add dashboard to admin router

**Step 1: Write the dashboard stats endpoint**

Create `src/orpc/routes/admin/dashboard.ts`:

```typescript
import { ORPCError } from "@orpc/server";
import { and, avg, count, desc, eq, gte, lte, ne, sql } from "drizzle-orm";
import {
  endOfMonth,
  startOfMonth,
  subDays,
  subMonths,
  differenceInDays,
  eachDayOfInterval,
  format,
} from "date-fns";
import { z } from "zod";

import { isAdminEmail } from "@/lib/auth/admin-check";
import { applications, jobs } from "@/lib/db/schema";

import { orpc, protectedProcedure } from "../../orpc-server";

const adminProcedure = protectedProcedure.use(async ({ context, next }) => {
  if (!isAdminEmail(context.session?.user?.email)) {
    throw new ORPCError("FORBIDDEN", { message: "Admin access required" });
  }
  return next({ context });
});

const periodSchema = z.enum(["7d", "30d", "month", "3months"]);

function getDateRange(period: z.infer<typeof periodSchema>) {
  const now = new Date();
  let startDate: Date;
  let endDate = now;

  switch (period) {
    case "7d":
      startDate = subDays(now, 7);
      break;
    case "30d":
      startDate = subDays(now, 30);
      break;
    case "month":
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      break;
    case "3months":
      startDate = subMonths(now, 3);
      break;
  }

  return { startDate, endDate };
}

function getPreviousDateRange(period: z.infer<typeof periodSchema>) {
  const { startDate, endDate } = getDateRange(period);
  const duration = differenceInDays(endDate, startDate);
  return {
    startDate: subDays(startDate, duration + 1),
    endDate: subDays(startDate, 1),
  };
}

export const adminDashboardRouter = orpc.router({
  stats: adminProcedure
    .input(z.object({ period: periodSchema.default("7d") }))
    .handler(async ({ input, context }) => {
      const { startDate, endDate } = getDateRange(input.period);
      const prev = getPreviousDateRange(input.period);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Run all queries in parallel
      const [
        totalAppsResult,
        prevAppsResult,
        newTodayResult,
        pendingResult,
        oldestPendingResult,
        activeJobsResult,
        jobsCreatedResult,
        avgScoreResult,
        topScoringJobResult,
        statusCountsResult,
        appsOverTimeResult,
        topJobsResult,
        recentAppsResult,
      ] = await Promise.all([
        // Total applications in period
        context.db
          .select({ count: count() })
          .from(applications)
          .where(
            and(
              gte(applications.createdAt, startDate),
              lte(applications.createdAt, endDate)
            )
          ),

        // Previous period applications
        context.db
          .select({ count: count() })
          .from(applications)
          .where(
            and(
              gte(applications.createdAt, prev.startDate),
              lte(applications.createdAt, prev.endDate)
            )
          ),

        // New today
        context.db
          .select({ count: count() })
          .from(applications)
          .where(gte(applications.createdAt, todayStart)),

        // Pending review (status = 'new')
        context.db
          .select({ count: count() })
          .from(applications)
          .where(eq(applications.status, "new")),

        // Oldest pending
        context.db
          .select({ createdAt: applications.createdAt })
          .from(applications)
          .where(eq(applications.status, "new"))
          .orderBy(applications.createdAt)
          .limit(1),

        // Active jobs
        context.db
          .select({ count: count() })
          .from(jobs)
          .where(eq(jobs.isActive, true)),

        // Jobs created in period
        context.db
          .select({ count: count() })
          .from(jobs)
          .where(
            and(gte(jobs.createdAt, startDate), lte(jobs.createdAt, endDate))
          ),

        // Average AI score (where not null)
        context.db
          .select({ avg: avg(applications.aiScore) })
          .from(applications)
          .where(
            and(
              gte(applications.createdAt, startDate),
              lte(applications.createdAt, endDate),
              sql`${applications.aiScore} IS NOT NULL`
            )
          ),

        // Top scoring job
        context.db
          .select({
            id: jobs.id,
            title: jobs.title,
            avgScore: avg(applications.aiScore),
          })
          .from(applications)
          .innerJoin(jobs, eq(applications.jobId, jobs.id))
          .where(
            and(
              gte(applications.createdAt, startDate),
              sql`${applications.aiScore} IS NOT NULL`
            )
          )
          .groupBy(jobs.id, jobs.title)
          .orderBy(desc(avg(applications.aiScore)))
          .limit(1),

        // Applications by status
        context.db
          .select({
            status: applications.status,
            count: count(),
          })
          .from(applications)
          .groupBy(applications.status),

        // Applications over time
        context.db
          .select({
            date: sql<string>`DATE(${applications.createdAt})`,
            count: count(),
          })
          .from(applications)
          .where(
            and(
              gte(applications.createdAt, startDate),
              lte(applications.createdAt, endDate)
            )
          )
          .groupBy(sql`DATE(${applications.createdAt})`)
          .orderBy(sql`DATE(${applications.createdAt})`),

        // Top jobs by applications
        context.db
          .select({
            id: jobs.id,
            title: jobs.title,
            count: count(),
            avgScore: avg(applications.aiScore),
          })
          .from(applications)
          .innerJoin(jobs, eq(applications.jobId, jobs.id))
          .where(
            and(
              gte(applications.createdAt, startDate),
              lte(applications.createdAt, endDate)
            )
          )
          .groupBy(jobs.id, jobs.title)
          .orderBy(desc(count()))
          .limit(5),

        // Recent applications
        context.db
          .select({
            id: applications.id,
            fullName: applications.fullName,
            email: applications.email,
            jobId: applications.jobId,
            jobTitle: jobs.title,
            aiScore: applications.aiScore,
            status: applications.status,
            createdAt: applications.createdAt,
          })
          .from(applications)
          .innerJoin(jobs, eq(applications.jobId, jobs.id))
          .orderBy(desc(applications.createdAt))
          .limit(10),
      ]);

      // Calculate conversion rate (past "new" status)
      const totalAll = statusCountsResult.reduce(
        (sum, s) => sum + Number(s.count),
        0
      );
      const newCount =
        statusCountsResult.find((s) => s.status === "new")?.count ?? 0;
      const conversionRate =
        totalAll > 0 ? ((totalAll - Number(newCount)) / totalAll) * 100 : 0;
      const interviewedCount =
        statusCountsResult.find((s) => s.status === "shortlisted")?.count ?? 0;
      const hiredCount =
        statusCountsResult.find((s) => s.status === "reviewed")?.count ?? 0;

      // Calculate oldest pending days
      const oldestPending = oldestPendingResult.at(0);
      const oldestPendingDays = oldestPending
        ? differenceInDays(new Date(), oldestPending.createdAt)
        : 0;

      // Fill in missing dates for chart
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const appsMap = new Map(
        appsOverTimeResult.map((r) => [r.date, Number(r.count)])
      );
      const applicationsOverTime = dateRange.map((date) => ({
        date: format(date, "yyyy-MM-dd"),
        count: appsMap.get(format(date, "yyyy-MM-dd")) ?? 0,
      }));

      // Status colors
      const statusColors: Record<string, string> = {
        new: "hsl(var(--chart-1))",
        reviewed: "hsl(var(--chart-2))",
        shortlisted: "hsl(var(--chart-3))",
        rejected: "hsl(var(--chart-4))",
      };

      return {
        totalApplications: Number(totalAppsResult.at(0)?.count ?? 0),
        totalApplicationsPrevious: Number(prevAppsResult.at(0)?.count ?? 0),
        newToday: Number(newTodayResult.at(0)?.count ?? 0),
        pendingReview: Number(pendingResult.at(0)?.count ?? 0),
        oldestPendingDays,
        activeJobs: Number(activeJobsResult.at(0)?.count ?? 0),
        jobsCreatedInPeriod: Number(jobsCreatedResult.at(0)?.count ?? 0),
        avgAiScore: avgScoreResult.at(0)?.avg
          ? Math.round(Number(avgScoreResult.at(0)?.avg))
          : null,
        topScoringJob: topScoringJobResult.at(0)
          ? {
              id: topScoringJobResult.at(0)!.id,
              title: topScoringJobResult.at(0)!.title,
            }
          : null,
        conversionRate: Math.round(conversionRate),
        interviewedCount: Number(interviewedCount),
        hiredCount: Number(hiredCount),
        applicationsOverTime,
        applicationsByStatus: statusCountsResult.map((s) => ({
          status: s.status,
          count: Number(s.count),
          color: statusColors[s.status] ?? "hsl(var(--chart-5))",
        })),
        topJobsByApplications: topJobsResult.map((j) => ({
          id: j.id,
          title: j.title,
          count: Number(j.count),
          avgScore: j.avgScore ? Math.round(Number(j.avgScore)) : null,
        })),
        recentApplications: recentAppsResult.map((a) => ({
          id: a.id,
          fullName: a.fullName,
          email: a.email,
          jobId: a.jobId,
          jobTitle: a.jobTitle,
          aiScore: a.aiScore,
          status: a.status,
          createdAt: a.createdAt.toISOString(),
        })),
      };
    }),
});
```

**Step 2: Register endpoint in router**

Update `src/orpc/index.ts` to add dashboard to admin router:

```typescript
import { adminDashboardRouter } from "./routes/admin/dashboard";

// In router definition, update admin:
admin: orpc.router({
  check: adminCheckRouter,
  jobs: adminJobsRouter,
  applications: adminApplicationsRouter,
  dashboard: adminDashboardRouter,
}),
```

**Step 3: Verify endpoint compiles**

Run: `bun run check`
Expected: No TypeScript errors

---

## Task 2: Create Period Selector Component

**Files:**

- Create: `src/features/dashboard/dashboard-period-select.tsx`

**Step 1: Create the period selector**

```typescript
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Period = "7d" | "30d" | "month" | "3months";

const periodLabels: Record<Period, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  month: "This month",
  "3months": "Last 3 months",
};

interface DashboardPeriodSelectProps {
  value: Period;
  onChange: (value: Period) => void;
}

export function DashboardPeriodSelect({
  value,
  onChange,
}: DashboardPeriodSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Period)}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(periodLabels) as Period[]).map((period) => (
          <SelectItem key={period} value={period}>
            {periodLabels[period]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

---

## Task 3: Create KPI Cards Component

**Files:**

- Create: `src/features/dashboard/dashboard-kpi-cards.tsx`

**Step 1: Create KPI cards grid**

```typescript
"use client";

import {
  Briefcase,
  Brain,
  Clock,
  FileText,
  Inbox,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtext: string;
  trend?: number;
  icon: React.ReactNode;
}

function KpiCard({ title, value, subtext, trend, icon }: KpiCardProps) {
  const TrendIcon = trend && trend >= 0 ? TrendingUp : TrendingDown;
  const trendColor =
    trend && trend >= 0
      ? "text-green-500 dark:text-green-400"
      : "text-red-500 dark:text-red-400";

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardDescription className="flex items-center gap-2">
          {icon}
          {title}
        </CardDescription>
        <CardTitle className="font-semibold @[250px]/card:text-3xl text-2xl tabular-nums">
          {value}
        </CardTitle>
        {trend !== undefined && (
          <div className="absolute top-4 right-4">
            <Badge className="flex gap-1 rounded-lg text-xs" variant="outline">
              <TrendIcon className={`size-3 ${trendColor}`} />
              {trend >= 0 ? "+" : ""}
              {trend}%
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardFooter className="text-muted-foreground text-sm">{subtext}</CardFooter>
    </Card>
  );
}

interface DashboardKpiCardsProps {
  totalApplications: number;
  totalApplicationsPrevious: number;
  newToday: number;
  pendingReview: number;
  oldestPendingDays: number;
  activeJobs: number;
  jobsCreatedInPeriod: number;
  avgAiScore: number | null;
  topScoringJob: { id: string; title: string } | null;
  conversionRate: number;
  interviewedCount: number;
  hiredCount: number;
}

export function DashboardKpiCards({
  totalApplications,
  totalApplicationsPrevious,
  newToday,
  pendingReview,
  oldestPendingDays,
  activeJobs,
  jobsCreatedInPeriod,
  avgAiScore,
  topScoringJob,
  conversionRate,
  interviewedCount,
  hiredCount,
}: DashboardKpiCardsProps) {
  const trend =
    totalApplicationsPrevious > 0
      ? Math.round(
          ((totalApplications - totalApplicationsPrevious) /
            totalApplicationsPrevious) *
            100
        )
      : 0;

  return (
    <div className="grid @5xl/main:grid-cols-6 @3xl/main:grid-cols-3 @xl/main:grid-cols-2 grid-cols-1 gap-4 px-4 lg:px-6">
      <KpiCard
        icon={<FileText className="size-4" />}
        subtext={`${trend >= 0 ? "+" : ""}${trend}% vs last period`}
        title="Total Applications"
        trend={trend}
        value={totalApplications}
      />
      <KpiCard
        icon={<Inbox className="size-4" />}
        subtext={`${pendingReview} pending review`}
        title="New Today"
        value={newToday}
      />
      <KpiCard
        icon={<Briefcase className="size-4" />}
        subtext={`${jobsCreatedInPeriod} created this period`}
        title="Active Jobs"
        value={activeJobs}
      />
      <KpiCard
        icon={<Brain className="size-4" />}
        subtext={topScoringJob ? `Top: ${topScoringJob.title}` : "No scores yet"}
        title="Avg AI Score"
        value={avgAiScore ?? "—"}
      />
      <KpiCard
        icon={<TrendingUp className="size-4" />}
        subtext={`${interviewedCount} interviewed, ${hiredCount} hired`}
        title="Conversion Rate"
        value={`${conversionRate}%`}
      />
      <KpiCard
        icon={<Clock className="size-4" />}
        subtext={
          oldestPendingDays > 0 ? `Oldest: ${oldestPendingDays} days ago` : "All reviewed"
        }
        title="Pending Review"
        value={pendingReview}
      />
    </div>
  );
}
```

---

## Task 4: Create Charts Component

**Files:**

- Create: `src/features/dashboard/dashboard-charts.tsx`

**Step 1: Create charts section**

```typescript
"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ApplicationsOverTimeData {
  date: string;
  count: number;
}

interface ApplicationsByStatusData {
  status: string;
  count: number;
  color: string;
}

interface TopJobData {
  id: string;
  title: string;
  count: number;
  avgScore: number | null;
}

interface DashboardChartsProps {
  applicationsOverTime: ApplicationsOverTimeData[];
  applicationsByStatus: ApplicationsByStatusData[];
  topJobsByApplications: TopJobData[];
}

const areaChartConfig = {
  count: {
    label: "Applications",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const barChartConfig = {
  count: {
    label: "Applications",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function DashboardCharts({
  applicationsOverTime,
  applicationsByStatus,
  topJobsByApplications,
}: DashboardChartsProps) {
  const pieConfig = applicationsByStatus.reduce(
    (acc, item) => ({
      ...acc,
      [item.status]: { label: item.status, color: item.color },
    }),
    {} as ChartConfig
  );

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      {/* Row 1: Area + Pie */}
      <div className="grid @3xl/main:grid-cols-5 grid-cols-1 gap-4">
        {/* Applications Over Time - 60% */}
        <Card className="@3xl/main:col-span-3">
          <CardHeader>
            <CardTitle>Applications Over Time</CardTitle>
            <CardDescription>Daily application submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-[250px] w-full" config={areaChartConfig}>
              <AreaChart data={applicationsOverTime}>
                <defs>
                  <linearGradient id="fillCount" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="date"
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  tickLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                  }
                  cursor={false}
                />
                <Area
                  dataKey="count"
                  fill="url(#fillCount)"
                  stroke="var(--color-count)"
                  type="monotone"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Applications by Status - 40% */}
        <Card className="@3xl/main:col-span-2">
          <CardHeader>
            <CardTitle>Applications by Status</CardTitle>
            <CardDescription>Current pipeline distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="mx-auto h-[250px] w-full" config={pieConfig}>
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  cx="50%"
                  cy="50%"
                  data={applicationsByStatus}
                  dataKey="count"
                  innerRadius={60}
                  nameKey="status"
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {applicationsByStatus.map((entry) => (
                    <Cell key={entry.status} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Top Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Top Jobs by Applications</CardTitle>
          <CardDescription>Most popular positions</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[200px] w-full" config={barChartConfig}>
            <BarChart
              data={topJobsByApplications}
              layout="vertical"
              margin={{ left: 120 }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                axisLine={false}
                dataKey="title"
                tickFormatter={(value) =>
                  value.length > 20 ? `${value.slice(0, 20)}...` : value
                }
                tickLine={false}
                type="category"
                width={120}
              />
              <XAxis axisLine={false} tickLine={false} type="number" />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, props) => [
                      `${value} applications${
                        props.payload.avgScore
                          ? ` (avg score: ${props.payload.avgScore})`
                          : ""
                      }`,
                      props.payload.title,
                    ]}
                  />
                }
              />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Task 5: Create Recent Applications Table

**Files:**

- Create: `src/features/dashboard/dashboard-recent-table.tsx`

**Step 1: Create recent applications table**

```typescript
"use client";

import { Link } from "@tanstack/react-router";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

function getScoreBadgeVariant(score: number | null) {
  if (score === null) return "outline";
  if (score >= 70) return "default";
  if (score >= 50) return "secondary";
  return "destructive";
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "new":
      return "outline";
    case "reviewed":
      return "secondary";
    case "shortlisted":
      return "default";
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
}

export function DashboardRecentTable({
  applications,
}: DashboardRecentTableProps) {
  return (
    <Card className="mx-4 lg:mx-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Applications</CardTitle>
          <CardDescription>Latest candidate submissions</CardDescription>
        </div>
        <Link to="/admin/applications">
          <Button size="sm" variant="outline">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>AI Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.length === 0 ? (
              <TableRow>
                <TableCell className="text-muted-foreground text-center" colSpan={6}>
                  No applications yet
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <div className="font-medium">{app.fullName}</div>
                    <div className="text-muted-foreground text-sm">{app.email}</div>
                  </TableCell>
                  <TableCell>
                    <Link
                      className="text-primary hover:underline"
                      to="/admin/jobs"
                    >
                      {app.jobTitle}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getScoreBadgeVariant(app.aiScore)}>
                      {app.aiScore ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(app.status)}>
                      {app.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatRelativeTime(app.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 size-4" />
                          View CV
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <X className="mr-2 size-4" />
                          Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

---

## Task 6: Create Dashboard Page Component

**Files:**

- Create: `src/features/dashboard/dashboard.page.tsx`
- Create: `src/features/dashboard/index.ts`

**Step 1: Create main page component**

```typescript
"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearch, useNavigate } from "@tanstack/react-router";

import { orpc } from "@/orpc/orpc-client";

import { DashboardCharts } from "./dashboard-charts";
import { DashboardKpiCards } from "./dashboard-kpi-cards";
import { DashboardPeriodSelect, type Period } from "./dashboard-period-select";
import { DashboardRecentTable } from "./dashboard-recent-table";

interface DashboardPageProps {
  initialPeriod?: Period;
}

export function DashboardPage({ initialPeriod = "7d" }: DashboardPageProps) {
  const search = useSearch({ from: "/(dashboard)/overview/" });
  const navigate = useNavigate();
  const period = (search.period as Period) || initialPeriod;

  const { data, isLoading } = useQuery({
    ...orpc.admin.dashboard.stats.queryOptions({
      input: { period },
    }),
    placeholderData: keepPreviousData,
  });

  const handlePeriodChange = (newPeriod: Period) => {
    navigate({
      to: "/overview",
      search: { period: newPeriod },
    });
  };

  if (isLoading && !data) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-6 py-6">
        <div className="flex items-center justify-between px-4 lg:px-6">
          <div>
            <h1 className="font-semibold text-2xl">Recruiting Overview</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h1 className="font-semibold text-2xl">Recruiting Overview</h1>
          <p className="text-muted-foreground">
            Track applications, jobs, and hiring metrics
          </p>
        </div>
        <DashboardPeriodSelect onChange={handlePeriodChange} value={period} />
      </div>

      {/* KPI Cards */}
      {data && (
        <DashboardKpiCards
          activeJobs={data.activeJobs}
          avgAiScore={data.avgAiScore}
          conversionRate={data.conversionRate}
          hiredCount={data.hiredCount}
          interviewedCount={data.interviewedCount}
          jobsCreatedInPeriod={data.jobsCreatedInPeriod}
          newToday={data.newToday}
          oldestPendingDays={data.oldestPendingDays}
          pendingReview={data.pendingReview}
          topScoringJob={data.topScoringJob}
          totalApplications={data.totalApplications}
          totalApplicationsPrevious={data.totalApplicationsPrevious}
        />
      )}

      {/* Charts */}
      {data && (
        <DashboardCharts
          applicationsByStatus={data.applicationsByStatus}
          applicationsOverTime={data.applicationsOverTime}
          topJobsByApplications={data.topJobsByApplications}
        />
      )}

      {/* Recent Applications */}
      {data && <DashboardRecentTable applications={data.recentApplications} />}
    </div>
  );
}
```

**Step 2: Create index export**

```typescript
export { DashboardPage } from "./dashboard.page";
export { DashboardPeriodSelect, type Period } from "./dashboard-period-select";
export { DashboardKpiCards } from "./dashboard-kpi-cards";
export { DashboardCharts } from "./dashboard-charts";
export { DashboardRecentTable } from "./dashboard-recent-table";
```

---

## Task 7: Update Overview Route

**Files:**

- Modify: `src/routes/(dashboard)/overview/index.tsx` - replace with recruiting dashboard

**Step 1: Update route to use new dashboard**

Replace entire file with:

```typescript
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { DashboardPage } from "@/features/dashboard";
import { getUserWithAdmin } from "@/lib/auth/get-user-admin";

export const Route = createFileRoute("/(dashboard)/overview/")({
  validateSearch: z.object({
    period: z.enum(["7d", "30d", "month", "3months"]).optional(),
  }),
  beforeLoad: async () => {
    const result = await getUserWithAdmin();
    if (!result.isAdmin) {
      throw redirect({ to: "/settings" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <DashboardPage />;
}
```

**Step 2: Verify route compiles**

Run: `bun run check`
Expected: No TypeScript errors

---

## Task 8: Verify and Test

**Step 1: Run type check**

Run: `bun run check`
Expected: No errors

**Step 2: Start dev server**

Run: `bun dev`
Expected: Server starts without errors

**Step 3: Test dashboard**

Navigate to: `http://localhost:5173/overview`
Expected:

- See "Recruiting Overview" header
- See period selector (defaults to 7 days)
- See 6 KPI cards with real data
- See area chart, pie chart, bar chart
- See recent applications table
- Changing period updates all data

---

## Summary

Files created:

1. `src/orpc/routes/admin/dashboard.ts` - ORPC endpoint
2. `src/features/dashboard/dashboard-period-select.tsx` - Period selector
3. `src/features/dashboard/dashboard-kpi-cards.tsx` - KPI cards
4. `src/features/dashboard/dashboard-charts.tsx` - Charts section
5. `src/features/dashboard/dashboard-recent-table.tsx` - Recent table
6. `src/features/dashboard/dashboard.page.tsx` - Main page
7. `src/features/dashboard/index.ts` - Exports

Files modified:

1. `src/orpc/index.ts` - Add dashboard to admin router
2. `src/routes/(dashboard)/overview/index.tsx` - Use new dashboard
