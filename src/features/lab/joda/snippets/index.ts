import type { CategoryId, Snippet } from "../types";

import { arithmeticSnippets } from "./arithmetic";
import { comparisonSnippets } from "./comparisons";
import { creationSnippets } from "./creation";
import { formattingSnippets } from "./formatting";
import { parsingSnippets } from "./parsing";
import { timezoneSnippets } from "./timezone";

export const allSnippets: Snippet[] = [
  ...creationSnippets,
  ...formattingSnippets,
  ...parsingSnippets,
  ...arithmeticSnippets,
  ...comparisonSnippets,
  ...timezoneSnippets,
];

export function getSnippetsByCategory(category: CategoryId): Snippet[] {
  return allSnippets.filter((s) => s.category === category);
}

export function getSnippetById(id: string): Snippet | undefined {
  return allSnippets.find((s) => s.id === id);
}

export {
  arithmeticSnippets,
  comparisonSnippets,
  creationSnippets,
  formattingSnippets,
  parsingSnippets,
  timezoneSnippets,
};
