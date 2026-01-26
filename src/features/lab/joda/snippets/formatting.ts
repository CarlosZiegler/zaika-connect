import { DateTimeFormatter, LocalDate } from "@js-joda/core";

import type { Snippet } from "../types";

const STYLE_PATTERNS: Record<string, string> = {
  FULL: "EEEE, d. MMMM yyyy",
  LONG: "d. MMMM yyyy",
  MEDIUM: "d. MMM yyyy",
  SHORT: "dd.MM.yy",
};

export const formattingSnippets: Snippet[] = [
  {
    id: "localized-date",
    name: "Format with localized style",
    description: "Format a date using style (FULL, LONG, MEDIUM, SHORT)",
    category: "formatting",
    parameters: [
      { id: "date", type: "date", label: "Date", default: "today" },
      {
        id: "style",
        type: "enum",
        label: "Style",
        options: ["FULL", "LONG", "MEDIUM", "SHORT"],
        default: "MEDIUM",
      },
    ],
    execute: (params, locale) => {
      const date =
        params.date === "today"
          ? LocalDate.now()
          : LocalDate.parse(params.date as string);
      const pattern =
        STYLE_PATTERNS[params.style as string] ?? STYLE_PATTERNS.MEDIUM;
      const formatter = DateTimeFormatter.ofPattern(pattern).withLocale(locale);
      return date.format(formatter);
    },
  },
  {
    id: "custom-pattern",
    name: "Format with custom pattern",
    description:
      "Format a date using a custom pattern like 'dd.MM.yyyy' or 'EEEE, d. MMMM'",
    category: "formatting",
    parameters: [
      { id: "date", type: "date", label: "Date", default: "today" },
      {
        id: "pattern",
        type: "text",
        label: "Pattern",
        default: "EEEE, d. MMMM yyyy",
      },
    ],
    execute: (params, locale) => {
      const date =
        params.date === "today"
          ? LocalDate.now()
          : LocalDate.parse(params.date as string);
      const formatter = DateTimeFormatter.ofPattern(
        params.pattern as string
      ).withLocale(locale);
      return date.format(formatter);
    },
  },
  {
    id: "weekday-month-names",
    name: "Get weekday and month names",
    description: "Display localized weekday and month names for a date",
    category: "formatting",
    parameters: [{ id: "date", type: "date", label: "Date", default: "today" }],
    execute: (params, locale) => {
      const date =
        params.date === "today"
          ? LocalDate.now()
          : LocalDate.parse(params.date as string);
      const weekdayFormatter =
        DateTimeFormatter.ofPattern("EEEE").withLocale(locale);
      const monthFormatter =
        DateTimeFormatter.ofPattern("MMMM").withLocale(locale);
      const weekday = date.format(weekdayFormatter);
      const month = date.format(monthFormatter);
      return `Weekday: ${weekday}\nMonth: ${month}`;
    },
  },
  {
    id: "relative-pattern",
    name: "Format with relative pattern",
    description: "Common date patterns like 'January 2026' or 'Mon, Jan 27'",
    category: "formatting",
    parameters: [
      { id: "date", type: "date", label: "Date", default: "today" },
      {
        id: "pattern",
        type: "enum",
        label: "Pattern",
        options: ["MMMM yyyy", "EEE, MMM d", "d. MMM", "yyyy-MM-dd"],
        default: "MMMM yyyy",
      },
    ],
    execute: (params, locale) => {
      const date =
        params.date === "today"
          ? LocalDate.now()
          : LocalDate.parse(params.date as string);
      const formatter = DateTimeFormatter.ofPattern(
        params.pattern as string
      ).withLocale(locale);
      return date.format(formatter);
    },
  },
];
