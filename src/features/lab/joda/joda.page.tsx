"use client";

import type { Locale } from "@js-joda/locale_de";

import { CalendarClock, Globe, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { LanguageSwitch } from "@/components/language-switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { loadLocaleForLanguage } from "./locale-provider";
import { getAllSnippets } from "./snippets";

export function JodaPage() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const [locale, setLocale] = useState<Locale | null>(null);
  const [loading, setLoading] = useState(true);

  // Load locale on mount - triggers page reload if locale needs to change
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const result = await loadLocaleForLanguage(currentLang);

        if (result.needsReload) {
          // js-joda's global plugin can't switch locales at runtime
          // Page reload is required for the new locale to work
          window.location.reload();
          return;
        }

        if (!cancelled) {
          setLocale(result.locale);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load locale:", err);
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [currentLang]);

  const snippets = useMemo(() => getAllSnippets(), []);

  // Pre-defined examples to showcase
  const examples = useMemo(
    () => [
      {
        snippetId: "localized-date",
        params: { date: "2026-01-27", style: "FULL" },
        title: "Full Date Format",
      },
      {
        snippetId: "localized-date",
        params: { date: "2026-01-27", style: "MEDIUM" },
        title: "Medium Date Format",
      },
      {
        snippetId: "custom-pattern",
        params: { date: "2026-01-27", pattern: "EEEE, d. MMMM yyyy" },
        title: "Custom Pattern",
      },
      {
        snippetId: "weekday-month-names",
        params: { date: "2026-01-27" },
        title: "Weekday & Month Names",
      },
      {
        snippetId: "relative-pattern",
        params: { date: "2026-01-27", pattern: "MMMM yyyy" },
        title: "Month Year Format",
      },
      {
        snippetId: "local-date-now",
        params: {},
        title: "Current Date",
      },
      {
        snippetId: "local-date-of",
        params: { year: 2026, month: 12, day: 25 },
        title: "Create Specific Date",
      },
      {
        snippetId: "local-date-time-now",
        params: {},
        title: "Current DateTime",
      },
      {
        snippetId: "add-days",
        params: { date: "2026-01-27", days: 30 },
        title: "Add Days",
      },
      {
        snippetId: "period-between",
        params: { startDate: "2026-01-01", endDate: "2026-12-31" },
        title: "Period Between Dates",
      },
      {
        snippetId: "is-before-after",
        params: { date1: "2026-01-01", date2: "2026-12-31" },
        title: "Compare Dates",
      },
      {
        snippetId: "is-weekend",
        params: { date: "2026-01-31" },
        title: "Check Weekend",
      },
    ],
    []
  );

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <CalendarClock className="size-6" />
          js-joda Playground
        </h1>
        <p className="text-muted-foreground">
          Date/time formatting examples using your current language setting
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <LanguageSwitch />
          <Badge variant="secondary" className="gap-1">
            <Globe className="size-3" />
            Locale: {currentLang.toUpperCase()}
          </Badge>
          <Badge variant="outline">@js-joda/core v5.7.0</Badge>
          <Badge variant="outline">@js-joda/locale v4.15.3</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {examples.map((example, index) => {
          const snippet = snippets.find((s) => s.id === example.snippetId);
          if (!snippet || !locale) return null;

          let result: string;
          let error: string | null = null;

          try {
            result = snippet.execute(example.params, locale);
          } catch (err) {
            result = "";
            error = err instanceof Error ? err.message : "Error";
          }

          return (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {example.title}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {snippet.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.keys(example.params).length > 0 && (
                  <div className="rounded-md bg-muted/50 p-2">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Parameters
                    </p>
                    <div className="space-y-1">
                      {Object.entries(example.params).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="font-mono">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-md border bg-background p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Result ({currentLang.toUpperCase()})
                  </p>
                  {error ? (
                    <p className="font-mono text-sm text-destructive">
                      {error}
                    </p>
                  ) : (
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {result}
                    </pre>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
