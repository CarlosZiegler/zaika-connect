import { LocalDateTime, ZonedDateTime, ZoneId } from "@js-joda/core";
import "@js-joda/timezone";
import type { Snippet } from "../types";

const COMMON_ZONES = [
  "Europe/Berlin",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
  "UTC",
];

export const timezoneSnippets: Snippet[] = [
  {
    id: "convert-timezone",
    name: "Convert between timezones",
    description: "Convert a datetime from one timezone to another",
    category: "timezone",
    parameters: [
      {
        id: "datetime",
        type: "text",
        label: "DateTime (ISO)",
        default: "2026-01-27T12:00:00",
      },
      {
        id: "fromZone",
        type: "enum",
        label: "From timezone",
        options: COMMON_ZONES,
        default: "Europe/Berlin",
      },
      {
        id: "toZone",
        type: "enum",
        label: "To timezone",
        options: COMMON_ZONES,
        default: "America/New_York",
      },
    ],
    execute: (params) => {
      const ldt = LocalDateTime.parse(params.datetime as string);
      const fromZone = ZoneId.of(params.fromZone as string);
      const toZone = ZoneId.of(params.toZone as string);
      const fromZdt = ldt.atZone(fromZone);
      const toZdt = fromZdt.withZoneSameInstant(toZone);
      return `From: ${fromZdt.toString()}\nTo: ${toZdt.toString()}`;
    },
  },
  {
    id: "get-offset",
    name: "Get timezone offset",
    description: "Get the UTC offset for a timezone at a specific time",
    category: "timezone",
    parameters: [
      {
        id: "zone",
        type: "enum",
        label: "Timezone",
        options: COMMON_ZONES,
        default: "Europe/Berlin",
      },
      {
        id: "datetime",
        type: "text",
        label: "DateTime (ISO)",
        default: "2026-01-27T12:00:00",
      },
    ],
    execute: (params) => {
      const ldt = LocalDateTime.parse(params.datetime as string);
      const zone = ZoneId.of(params.zone as string);
      const zdt = ldt.atZone(zone);
      const offset = zdt.offset();
      return `Zone: ${zone.toString()}\nDateTime: ${zdt.toLocalDateTime()}\nOffset: ${offset.toString()}\nFull: ${zdt.toString()}`;
    },
  },
  {
    id: "list-zones",
    name: "Common timezones",
    description: "Show a list of common timezone IDs",
    category: "timezone",
    parameters: [],
    execute: () => {
      return COMMON_ZONES.map((zone) => {
        const now = ZonedDateTime.now(ZoneId.of(zone));
        return `${zone}: ${now.offset()}`;
      }).join("\n");
    },
  },
  {
    id: "current-time-in-zones",
    name: "Current time in multiple zones",
    description: "Show the current time in several timezones at once",
    category: "timezone",
    parameters: [],
    execute: () => {
      return COMMON_ZONES.slice(0, 5)
        .map((zone) => {
          const now = ZonedDateTime.now(ZoneId.of(zone));
          return `${zone}: ${now.toLocalTime().toString()}`;
        })
        .join("\n");
    },
  },
];
