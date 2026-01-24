"use client";

import {
  Briefcase,
  Brain,
  Clock,
  FileText,
  Inbox,
  TrendingDown,
  TrendingUp,
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
  const isTrendingUp = trend !== undefined && trend >= 0;

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardDescription>{title}</CardDescription>
          <div className="text-muted-foreground">{icon}</div>
        </div>
        <CardTitle className="font-semibold @[250px]/card:text-3xl text-2xl tabular-nums">
          {value}
        </CardTitle>
        {trend !== undefined && (
          <div className="absolute top-4 right-4">
            <Badge className="flex gap-1 rounded-lg text-xs" variant="outline">
              {isTrendingUp ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {isTrendingUp ? "+" : ""}
              {trend}%
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1 text-sm">
        <div className="text-muted-foreground">{subtext}</div>
      </CardFooter>
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
  const applicationsTrend =
    totalApplicationsPrevious > 0
      ? Math.round(
          ((totalApplications - totalApplicationsPrevious) /
            totalApplicationsPrevious) *
            100
        )
      : 0;

  const avgAiScoreDisplay = avgAiScore !== null ? avgAiScore.toFixed(1) : "—";
  const topJobName = topScoringJob?.title || "N/A";

  return (
    <div className="grid @5xl/main:grid-cols-6 @3xl/main:grid-cols-3 @xl/main:grid-cols-2 grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 dark:*:data-[slot=card]:bg-card">
      <KpiCard
        title="Total Applications"
        value={totalApplications}
        subtext="Overall application count"
        trend={applicationsTrend}
        icon={<FileText className="size-4" />}
      />
      <KpiCard
        title="New Today"
        value={newToday}
        subtext={`${pendingReview} pending review`}
        icon={<Inbox className="size-4" />}
      />
      <KpiCard
        title="Active Jobs"
        value={activeJobs}
        subtext={`${jobsCreatedInPeriod} created this period`}
        icon={<Briefcase className="size-4" />}
      />
      <KpiCard
        title="Avg AI Score"
        value={avgAiScoreDisplay}
        subtext={`Top job: ${topJobName}`}
        icon={<Brain className="size-4" />}
      />
      <KpiCard
        title="Conversion Rate"
        value={`${conversionRate}%`}
        subtext={`${interviewedCount} interviewed, ${hiredCount} hired`}
        icon={<TrendingUp className="size-4" />}
      />
      <KpiCard
        title="Pending Review"
        value={pendingReview}
        subtext={`Oldest: ${oldestPendingDays} days ago`}
        icon={<Clock className="size-4" />}
      />
    </div>
  );
}
