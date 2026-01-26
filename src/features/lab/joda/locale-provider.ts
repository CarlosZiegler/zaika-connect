/**
 * js-joda locale provider that uses the app's current language setting.
 *
 * IMPORTANT: The prebuilt locale packages (@js-joda/locale_de, locale_en)
 * use a GLOBAL plugin system. Only ONE locale's CLDR data can be active
 * at a time. Switching locales requires a page reload.
 */
import type { Locale } from "@js-joda/locale_de";

export type { Locale };

// Track which locale is currently loaded in the global js-joda state
let loadedLocaleLang: string | null = null;
let loadedLocale: Locale | null = null;

/**
 * Load the locale for the given language.
 *
 * Due to js-joda's global plugin architecture, only ONE locale can be
 * active at a time. If a different locale was previously loaded,
 * this returns { locale, needsReload: true } to indicate a page
 * reload is required for the new locale to work.
 */
export async function loadLocaleForLanguage(
  lang: string
): Promise<{ locale: Locale; needsReload: boolean }> {
  const normalizedLang = lang.startsWith("de") ? "de" : "en";

  // If same locale already loaded, return it
  if (loadedLocale && loadedLocaleLang === normalizedLang) {
    return { locale: loadedLocale, needsReload: false };
  }

  // If a DIFFERENT locale was already loaded, we need a page reload
  // because js-joda's global CLDR data can't be changed at runtime
  if (loadedLocaleLang !== null && loadedLocaleLang !== normalizedLang) {
    // Return the OLD locale but signal reload needed
    return { locale: loadedLocale!, needsReload: true };
  }

  // First time loading - import the correct package
  if (normalizedLang === "de") {
    const { Locale } = await import("@js-joda/locale_de");
    loadedLocale = Locale.GERMAN;
    loadedLocaleLang = "de";
    return { locale: Locale.GERMAN, needsReload: false };
  }

  const { Locale } = await import("@js-joda/locale_en");
  loadedLocale = Locale.ENGLISH;
  loadedLocaleLang = "en";
  return { locale: Locale.ENGLISH, needsReload: false };
}

/**
 * Get which locale language is currently loaded.
 */
export function getLoadedLocaleLang(): string | null {
  return loadedLocaleLang;
}

/**
 * Force reload the page to switch locale.
 */
export function reloadForLocaleSwitch(): void {
  window.location.reload();
}
