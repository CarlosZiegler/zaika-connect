import {
  Instant,
  LocalDate,
  LocalDateTime,
  ZonedDateTime,
  ZoneId,
} from "@js-joda/core";
import "@js-joda/timezone";
import type { Snippet } from "../types";

export const creationSnippets: Snippet[] = [
  {
    id: "local-date-now",
    name: "LocalDate.now()",
    description: "Get the current date without time",
    category: "creation",
    parameters: [],
    execute: () => {
      return LocalDate.now().toString();
    },
  },
  {
    id: "local-date-of",
    name: "LocalDate.of(year, month, day)",
    description: "Create a specific date",
    category: "creation",
    parameters: [
      { id: "year", type: "number", label: "Year", default: 2026 },
      { id: "month", type: "number", label: "Month (1-12)", default: 1 },
      { id: "day", type: "number", label: "Day", default: 1 },
    ],
    execute: (params) => {
      const date = LocalDate.of(
        params.year as number,
        params.month as number,
        params.day as number
      );
      return date.toString();
    },
  },
  {
    id: "local-date-time-now",
    name: "LocalDateTime.now()",
    description: "Get the current date and time",
    category: "creation",
    parameters: [],
    execute: () => {
      return LocalDateTime.now().toString();
    },
  },
  {
    id: "local-date-time-of",
    name: "LocalDateTime.of(year, month, day, hour, minute)",
    description: "Create a specific date and time",
    category: "creation",
    parameters: [
      { id: "year", type: "number", label: "Year", default: 2026 },
      { id: "month", type: "number", label: "Month (1-12)", default: 1 },
      { id: "day", type: "number", label: "Day", default: 1 },
      { id: "hour", type: "number", label: "Hour (0-23)", default: 12 },
      { id: "minute", type: "number", label: "Minute (0-59)", default: 0 },
    ],
    execute: (params) => {
      const dateTime = LocalDateTime.of(
        params.year as number,
        params.month as number,
        params.day as number,
        params.hour as number,
        params.minute as number
      );
      return dateTime.toString();
    },
  },
  {
    id: "zoned-date-time-now",
    name: "ZonedDateTime.now(zone)",
    description: "Get current date/time in a specific timezone",
    category: "creation",
    parameters: [
      {
        id: "zone",
        type: "enum",
        label: "Timezone",
        options: [
          "Europe/Berlin",
          "Europe/London",
          "America/New_York",
          "Asia/Tokyo",
          "UTC",
        ],
        default: "Europe/Berlin",
      },
    ],
    execute: (params) => {
      const zdt = ZonedDateTime.now(ZoneId.of(params.zone as string));
      return zdt.toString();
    },
  },
  {
    id: "instant-now",
    name: "Instant.now()",
    description: "Get the current instant (UTC timestamp)",
    category: "creation",
    parameters: [],
    execute: () => {
      return Instant.now().toString();
    },
  },
];
