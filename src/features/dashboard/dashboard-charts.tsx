"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
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
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface DashboardChartsProps {
  applicationsOverTime: Array<{ date: string; count: number }>;
  applicationsByStatus: Array<{ status: string; count: number; color: string }>;
}

function ApplicationsOverTimeChart({
  data,
}: {
  data: Array<{ date: string; count: number }>;
}) {
  const chartConfig = {
    count: {
      label: "Applications",
      color: "#006466",
    },
  } satisfies ChartConfig;

  return (
    <Card className="col-span-1 lg:col-span-3 @container/card">
      <CardHeader>
        <CardTitle>Applications Over Time</CardTitle>
        <CardDescription>Application submissions by date</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          className="aspect-auto h-[250px] w-full"
          config={chartConfig}
        >
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillApplications" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-count)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-count)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              domain={[0, "auto"]}
              allowDecimals={false}
            />
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
                      year: "numeric",
                    })
                  }
                />
              }
              cursor={false}
            />
            <Area
              dataKey="count"
              fill="url(#fillApplications)"
              stroke="var(--color-count)"
              type="monotone"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function ApplicationsByStatusChart({
  data,
}: {
  data: Array<{ status: string; count: number; color: string }>;
}) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const chartConfig = data.reduce((acc, item) => {
    acc[item.status] = {
      label: item.status.charAt(0).toUpperCase() + item.status.slice(1),
      color: item.color,
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <Card className="col-span-1 lg:col-span-2 @container/card">
      <CardHeader>
        <CardTitle>Applications by Status</CardTitle>
        <CardDescription>Distribution of application statuses</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 pt-4">
        <ChartContainer
          className="aspect-square h-[200px] w-full"
          config={chartConfig}
        >
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value) => (value ?? 0).toLocaleString()}
                />
              }
              cursor={false}
            />
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell key={`cell-${entry.status}`} fill={entry.color} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        dominantBaseline="middle"
                        textAnchor="middle"
                        x={viewBox.cx}
                        y={viewBox.cy}
                      >
                        <tspan
                          className="fill-foreground font-bold text-2xl"
                          x={viewBox.cx}
                          y={viewBox.cy}
                        >
                          {total}
                        </tspan>
                        <tspan
                          className="fill-muted-foreground text-xs"
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 18}
                        >
                          Total
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-3">
          {data.map((item) => (
            <div key={item.status} className="flex items-center gap-1.5">
              <div
                className="size-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground text-xs capitalize">
                {item.status} ({item.count})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TopJobsByApplicationsChart({
  data,
}: {
  data: Array<{
    id: string;
    title: string;
    count: number;
    avgScore: number | null;
  }>;
}) {
  const chartConfig = {
    count: {
      label: "Applications",
      color: "#006466",
    },
  } satisfies ChartConfig;

  const truncatedData = data.map((item) => ({
    ...item,
    displayTitle:
      item.title.length > 20 ? `${item.title.slice(0, 20)}...` : item.title,
  }));

  if (data.length === 0) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Top Jobs by Applications</CardTitle>
          <CardDescription>Top 5 jobs with most applications</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center text-muted-foreground">
          No job application data yet
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Top Jobs by Applications</CardTitle>
        <CardDescription>Top 5 jobs with most applications</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          className="aspect-auto h-[300px] w-full"
          config={chartConfig}
        >
          <BarChart
            data={truncatedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis type="number" domain={[0, "auto"]} />
            <YAxis
              axisLine={false}
              dataKey="displayTitle"
              tickLine={false}
              tickMargin={8}
              type="category"
              width={150}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(value, name) => {
                    if (name === "count") {
                      return [(value ?? 0).toLocaleString(), "Applications"];
                    }
                    return [String(value ?? ""), String(name ?? "")];
                  }}
                />
              }
              cursor={false}
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[0, 8, 8, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function DashboardCharts({
  applicationsOverTime,
  applicationsByStatus,
}: DashboardChartsProps) {
  const hasTimeData = applicationsOverTime.some((d) => d.count > 0);
  const hasStatusData = applicationsByStatus.length > 0;

  return (
    <div className="px-4 lg:px-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {hasTimeData ? (
          <ApplicationsOverTimeChart data={applicationsOverTime} />
        ) : (
          <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
              <CardTitle>Applications Over Time</CardTitle>
              <CardDescription>Application submissions by date</CardDescription>
            </CardHeader>
            <CardContent className="flex h-[250px] items-center justify-center text-muted-foreground">
              No application data yet
            </CardContent>
          </Card>
        )}
        {hasStatusData ? (
          <ApplicationsByStatusChart data={applicationsByStatus} />
        ) : (
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>Applications by Status</CardTitle>
              <CardDescription>
                Distribution of application statuses
              </CardDescription>
            </CardHeader>
            <CardContent className="flex h-[250px] items-center justify-center text-muted-foreground">
              No status data yet
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
