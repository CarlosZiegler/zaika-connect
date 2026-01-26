import { ChronoUnit, LocalDate } from "@js-joda/core";

import type { Snippet } from "../types";

export const comparisonSnippets: Snippet[] = [
  {
    id: "is-before-after",
    name: "isBefore / isAfter",
    description: "Check if one date is before or after another",
    category: "comparisons",
    parameters: [
      { id: "date1", type: "date", label: "First date", default: "today" },
      { id: "date2", type: "date", label: "Second date", default: "today" },
    ],
    execute: (params) => {
      const date1 =
        params.date1 === "today"
          ? LocalDate.now()
          : LocalDate.parse(params.date1 as string);
      const date2 =
        params.date2 === "today"
          ? LocalDate.now()
          : LocalDate.parse(params.date2 as string);
      return `${date1} vs ${date2}\nisBefore: ${date1.isBefore(date2)}\nisAfter: ${date1.isAfter(date2)}\nisEqual: ${date1.equals(date2)}`;
    },
  },
  {
    id: "days-until",
    name: "Days until date",
    description: "Calculate how many days until a target date",
    category: "comparisons",
    parameters: [
      { id: "startDate", type: "date", label: "From date", default: "today" },
      {
        id: "targetDate",
        type: "date",
        label: "Target date",
        default: "today",
      },
    ],
    execute: (params) => {
      const start =
        params.startDate === "today"
          ? LocalDate.now()
          : LocalDate.parse(params.startDate as string);
      const target =
        params.targetDate === "today"
          ? LocalDate.now()
          : LocalDate.parse(params.targetDate as string);
      const days = start.until(target, ChronoUnit.DAYS);
      return `From: ${start}\nTo: ${target}\nDays: ${days}`;
    },
  },
  {
    id: "is-same-day-month-year",
    name: "Same day/month/year",
    description: "Check if two dates share the same day, month, or year",
    category: "comparisons",
    parameters: [
      { id: "date1", type: "date", label: "First date", default: "today" },
      { id: "date2", type: "date", label: "Second date", default: "today" },
    ],
    execute: (params) => {
      const date1 =
        params.date1 === "today"
          ? LocalDate.now()
          : LocalDate.parse(params.date1 as string);
      const date2 =
        params.date2 === "today"
          ? LocalDate.now()
          : LocalDate.parse(params.date2 as string);
      const sameYear = date1.year() === date2.year();
      const sameMonth = sameYear && date1.monthValue() === date2.monthValue();
      const sameDay = sameMonth && date1.dayOfMonth() === date2.dayOfMonth();
      return `${date1} vs ${date2}\nSame year: ${sameYear}\nSame month: ${sameMonth}\nSame day: ${sameDay}`;
    },
  },
  {
    id: "is-weekend",
    name: "Is weekend?",
    description: "Check if a date falls on Saturday or Sunday",
    category: "comparisons",
    parameters: [{ id: "date", type: "date", label: "Date", default: "today" }],
    execute: (params) => {
      const date =
        params.date === "today"
          ? LocalDate.now()
          : LocalDate.parse(params.date as string);
      const dayOfWeek = date.dayOfWeek();
      const isWeekend = dayOfWeek.value() >= 6;
      return `Date: ${date}\nDay of week: ${dayOfWeek.toString()}\nIs weekend: ${isWeekend}`;
    },
  },
];
