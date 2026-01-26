import "@js-joda/locale";
import { Locale } from "@js-joda/locale";
import { describe, expect, it } from "vitest";

import { formattingSnippets } from "../snippets/formatting";

describe("formatting snippets", () => {
  describe("localized-date", () => {
    const snippet = formattingSnippets.find((s) => s.id === "localized-date");

    it("formats date in German locale with FULL style", () => {
      const result = snippet?.execute(
        { date: "2026-01-27", style: "FULL" },
        Locale.GERMAN
      );
      expect(result).toContain("27");
      expect(result).toContain("Januar");
      expect(result).toContain("2026");
    });

    it("formats date in English locale with FULL style", () => {
      const result = snippet?.execute(
        { date: "2026-01-27", style: "FULL" },
        Locale.ENGLISH
      );
      expect(result).toContain("27");
      expect(result).toContain("January");
      expect(result).toContain("2026");
    });

    it("formats date with SHORT style", () => {
      const result = snippet?.execute(
        { date: "2026-01-27", style: "SHORT" },
        Locale.GERMAN
      );
      expect(result).toContain("27");
    });
  });

  describe("custom-pattern", () => {
    const snippet = formattingSnippets.find((s) => s.id === "custom-pattern");

    it("formats with custom pattern in German", () => {
      const result = snippet?.execute(
        { date: "2026-01-27", pattern: "EEEE, d. MMMM yyyy" },
        Locale.GERMAN
      );
      expect(result).toContain("Dienstag");
      expect(result).toContain("Januar");
    });

    it("formats with custom pattern in English", () => {
      const result = snippet?.execute(
        { date: "2026-01-27", pattern: "EEEE, MMMM d, yyyy" },
        Locale.ENGLISH
      );
      expect(result).toContain("Tuesday");
      expect(result).toContain("January");
    });
  });

  describe("weekday-month-names", () => {
    const snippet = formattingSnippets.find(
      (s) => s.id === "weekday-month-names"
    );

    it("shows German weekday and month names", () => {
      const result = snippet?.execute({ date: "2026-01-27" }, Locale.GERMAN);
      expect(result).toContain("Dienstag");
      expect(result).toContain("Januar");
    });

    it("shows English weekday and month names", () => {
      const result = snippet?.execute({ date: "2026-01-27" }, Locale.ENGLISH);
      expect(result).toContain("Tuesday");
      expect(result).toContain("January");
    });
  });
});
