import {
  ChronoUnit,
  Duration,
  LocalDate,
  LocalDateTime,
  Period,
} from "@js-joda/core";

import type { Snippet } from "../types";

export const arithmeticSnippets: Snippet[] = [
  {
    id: "add-days",
    name: "Add/subtract days",
    description:
      "Add or subtract days from a date (use negative for subtraction)",
    category: "arithmetic",
    parameters: [
      { id: "date", type: "date", label: "Date", default: "today" },
      { id: "days", type: "number", label: "Days to add", default: 7 },
    ],
    execute: (params) => {
      const date =
        params.date === "today"
          ? LocalDate.now()
          : LocalDate.parse(params.date as string);
      const result = date.plusDays(params.days as number);
      return `Original: ${date.toString()}\nResult: ${result.toString()}`;
    },
  },
  {
    id: "add-months",
    name: "Add/subtract months",
    description: "Add or subtract months from a date",
    category: "arithmetic",
    parameters: [
      { id: "date", type: "date", label: "Date", default: "today" },
      { id: "months", type: "number", label: "Months to add", default: 3 },
    ],
    execute: (params) => {
      const date =
        params.date === "today"
          ? LocalDate.now()
          : LocalDate.parse(params.date as string);
      const result = date.plusMonths(params.months as number);
      return `Original: ${date.toString()}\nResult: ${result.toString()}`;
    },
  },
  {
    id: "add-years",
    name: "Add/subtract years",
    description: "Add or subtract years from a date",
    category: "arithmetic",
    parameters: [
      { id: "date", type: "date", label: "Date", default: "today" },
      { id: "years", type: "number", label: "Years to add", default: 1 },
    ],
    execute: (params) => {
      const date =
        params.date === "today"
          ? LocalDate.now()
          : LocalDate.parse(params.date as string);
      const result = date.plusYears(params.years as number);
      return `Original: ${date.toString()}\nResult: ${result.toString()}`;
    },
  },
  {
    id: "period-between",
    name: "Period between dates",
    description: "Calculate the period (years, months, days) between two dates",
    category: "arithmetic",
    parameters: [
      { id: "startDate", type: "date", label: "Start date", default: "today" },
      { id: "endDate", type: "date", label: "End date", default: "today" },
    ],
    execute: (params) => {
      const start =
        params.startDate === "today"
          ? LocalDate.now()
          : LocalDate.parse(params.startDate as string);
      const end =
        params.endDate === "today"
          ? LocalDate.now()
          : LocalDate.parse(params.endDate as string);
      const period = Period.between(start, end);
      return `Period: ${period.years()} years, ${period.months()} months, ${period.days()} days\nTotal days: ${start.until(end, ChronoUnit.DAYS)}`;
    },
  },
  {
    id: "duration-between",
    name: "Duration between times",
    description:
      "Calculate duration (hours, minutes, seconds) between two times",
    category: "arithmetic",
    parameters: [
      {
        id: "startTime",
        type: "text",
        label: "Start (ISO)",
        default: "2026-01-27T09:00:00",
      },
      {
        id: "endTime",
        type: "text",
        label: "End (ISO)",
        default: "2026-01-27T17:30:00",
      },
    ],
    execute: (params) => {
      const start = LocalDateTime.parse(params.startTime as string);
      const end = LocalDateTime.parse(params.endTime as string);
      const duration = Duration.between(start, end);
      const hours = duration.toHours();
      const minutes = duration.toMinutes() % 60;
      return `Duration: ${hours} hours, ${minutes} minutes\nTotal minutes: ${duration.toMinutes()}\nTotal seconds: ${duration.seconds()}`;
    },
  },
];
