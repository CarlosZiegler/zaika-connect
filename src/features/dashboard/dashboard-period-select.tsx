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
