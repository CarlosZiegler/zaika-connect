"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearch, useNavigate } from "@tanstack/react-router";

import { orpc } from "@/orpc/orpc-client";

import {
  DashboardCharts,
  TopJobsByApplicationsChart,
} from "./dashboard-charts";
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
    ...orpc.admin.dashboard.stats.queryOptions({ input: { period } }),
    placeholderData: keepPreviousData,
  });

  const handlePeriodChange = (newPeriod: Period) => {
    navigate({ to: "/overview", search: { period: newPeriod } });
  };

  if (isLoading && !data) {
    return <div>Loading...</div>;
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 py-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h1 className="font-semibold text-2xl">Recruiting Overview</h1>
          <p className="text-muted-foreground">
            Track applications, jobs, and hiring metrics
          </p>
        </div>
        <DashboardPeriodSelect value={period} onChange={handlePeriodChange} />
      </div>

      {data && <DashboardKpiCards {...data} />}

      {data && (
        <DashboardCharts
          applicationsOverTime={data.applicationsOverTime}
          applicationsByStatus={data.applicationsByStatus}
        />
      )}

      {data && (
        <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
          <TopJobsByApplicationsChart data={data.topJobsByApplications} />
          <DashboardRecentTable applications={data.recentApplications} />
        </div>
      )}
    </div>
  );
}
