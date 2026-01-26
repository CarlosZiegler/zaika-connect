"use client";

import { Locale } from "@js-joda/locale";
import "@js-joda/locale_en";
import { CalendarClock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

import type { CategoryId } from "./types";

import { CategorySelect } from "./components/category-select";
import { LocaleToggle } from "./components/locale-toggle";
import { OutputDisplay } from "./components/output-display";
import { ParameterInputs } from "./components/parameter-inputs";
import { SnippetSelect } from "./components/snippet-select";
import { getSnippetById, getSnippetsByCategory } from "./snippets";

const LOCALES = {
  de: Locale.GERMAN,
  en: Locale.ENGLISH,
} as const;

export function JodaPage() {
  const [category, setCategory] = useState<CategoryId>("formatting");
  const [snippetId, setSnippetId] = useState<string | null>(null);
  const [params, setParams] = useState<Record<string, unknown>>({});
  const [locale, setLocale] = useState<"de" | "en">("de");
  const [compareMode, setCompareMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const snippets = useMemo(() => getSnippetsByCategory(category), [category]);
  const selectedSnippet = snippetId ? getSnippetById(snippetId) : null;

  // Reset snippet when category changes
  useEffect(() => {
    setSnippetId(null);
    setParams({});
    setError(null);
  }, [category]);

  // Initialize params when snippet changes
  useEffect(() => {
    if (selectedSnippet) {
      const initialParams: Record<string, unknown> = {};
      for (const param of selectedSnippet.parameters) {
        initialParams[param.id] = param.default;
      }
      setParams(initialParams);
      setError(null);
    }
  }, [selectedSnippet]);

  const handleParamChange = (id: string, value: unknown) => {
    setParams((prev) => ({ ...prev, [id]: value }));
    setError(null);
  };

  const output = useMemo(() => {
    if (!selectedSnippet) return null;
    try {
      return selectedSnippet.execute(params, LOCALES[locale]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    }
  }, [selectedSnippet, params, locale]);

  const compareOutput = useMemo(() => {
    if (!selectedSnippet || !compareMode) return null;
    try {
      return {
        de: selectedSnippet.execute(params, LOCALES.de),
        en: selectedSnippet.execute(params, LOCALES.en),
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    }
  }, [selectedSnippet, params, compareMode]);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <CalendarClock className="size-6" />
          js-joda Playground
        </h1>
        <p className="text-muted-foreground">
          Test js-joda date/time operations with locale switching
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <LocaleToggle
              locale={locale}
              onLocaleChange={setLocale}
              compareMode={compareMode}
              onCompareModeChange={setCompareMode}
            />
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="space-y-6 pt-6">
            <CategorySelect value={category} onChange={setCategory} />
            <SnippetSelect
              snippets={snippets}
              value={snippetId}
              onChange={setSnippetId}
            />
            {selectedSnippet && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Parameters</h3>
                <ParameterInputs
                  parameters={selectedSnippet.parameters}
                  values={params}
                  onChange={handleParamChange}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          <h3 className="mb-2 text-sm font-medium">Result</h3>
          <OutputDisplay
            output={output}
            compareOutput={compareOutput}
            compareMode={compareMode}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
