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
