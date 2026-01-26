import type { Locale } from "@js-joda/locale_en";

export type ParameterType = "text" | "date" | "number" | "enum";

export type Parameter =
  | { id: string; type: "text"; label: string; default?: string }
  | { id: string; type: "date"; label: string; default?: string }
  | { id: string; type: "number"; label: string; default?: number }
  | {
      id: string;
      type: "enum";
      label: string;
      options: string[];
      default?: string;
    };

export type Snippet = {
  id: string;
  name: string;
  description: string;
  category: CategoryId;
  parameters: Parameter[];
  execute: (params: Record<string, unknown>, locale: Locale) => string;
};

export type CategoryId =
  | "creation"
  | "formatting"
  | "parsing"
  | "arithmetic"
  | "comparisons"
  | "timezone";

export type Category = {
  id: CategoryId;
  name: string;
  description: string;
};

export const CATEGORIES: Category[] = [
  { id: "creation", name: "Creation", description: "Create date/time objects" },
  {
    id: "formatting",
    name: "Formatting",
    description: "Format dates with locales",
  },
  { id: "parsing", name: "Parsing", description: "Parse strings to dates" },
  { id: "arithmetic", name: "Arithmetic", description: "Add/subtract time" },
  { id: "comparisons", name: "Comparisons", description: "Compare dates" },
  { id: "timezone", name: "Timezone", description: "Timezone conversions" },
];
