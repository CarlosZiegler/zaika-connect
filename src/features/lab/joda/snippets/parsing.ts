import { DateTimeFormatter, LocalDate, LocalDateTime } from "@js-joda/core";

import type { Snippet } from "../types";

export const parsingSnippets: Snippet[] = [
  {
    id: "parse-iso-date",
    name: "Parse ISO date (yyyy-MM-dd)",
    description: "Parse a date from ISO format like '2026-01-27'",
    category: "parsing",
    parameters: [
      {
        id: "input",
        type: "text",
        label: "Date string",
        default: "2026-01-27",
      },
    ],
    execute: (params) => {
      const date = LocalDate.parse(params.input as string);
      return `Parsed: ${date.toString()}\nYear: ${date.year()}\nMonth: ${date.monthValue()}\nDay: ${date.dayOfMonth()}`;
    },
  },
  {
    id: "parse-iso-datetime",
    name: "Parse ISO datetime",
    description: "Parse a datetime from ISO format like '2026-01-27T14:30:00'",
    category: "parsing",
    parameters: [
      {
        id: "input",
        type: "text",
        label: "DateTime string",
        default: "2026-01-27T14:30:00",
      },
    ],
    execute: (params) => {
      const dt = LocalDateTime.parse(params.input as string);
      return `Parsed: ${dt.toString()}\nDate: ${dt.toLocalDate()}\nTime: ${dt.toLocalTime()}`;
    },
  },
  {
    id: "parse-custom-pattern",
    name: "Parse with custom pattern",
    description: "Parse a date using a custom pattern like 'dd.MM.yyyy'",
    category: "parsing",
    parameters: [
      {
        id: "input",
        type: "text",
        label: "Date string",
        default: "27.01.2026",
      },
      { id: "pattern", type: "text", label: "Pattern", default: "dd.MM.yyyy" },
    ],
    execute: (params, locale) => {
      const formatter = DateTimeFormatter.ofPattern(
        params.pattern as string
      ).withLocale(locale);
      const date = LocalDate.parse(params.input as string, formatter);
      return `Parsed: ${date.toString()}\nYear: ${date.year()}\nMonth: ${date.monthValue()}\nDay: ${date.dayOfMonth()}`;
    },
  },
  {
    id: "parse-localized",
    name: "Parse localized date",
    description: "Parse a date in localized format (varies by locale)",
    category: "parsing",
    parameters: [
      {
        id: "input",
        type: "text",
        label: "Date string",
        default: "27. Januar 2026",
      },
      {
        id: "pattern",
        type: "text",
        label: "Pattern",
        default: "d. MMMM yyyy",
      },
    ],
    execute: (params, locale) => {
      const formatter = DateTimeFormatter.ofPattern(
        params.pattern as string
      ).withLocale(locale);
      const date = LocalDate.parse(params.input as string, formatter);
      return `Parsed: ${date.toString()}`;
    },
  },
];
