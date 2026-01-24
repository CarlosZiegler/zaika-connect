import { Link } from "@tanstack/react-router";
import { Send, Waves } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "@/components/public/language-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const JOB_SEEKER_LINKS = [
  { href: "/jobs", i18nKey: "PUBLIC_NAV_FIND_JOBS" },
  { href: "/cv-review", i18nKey: "PUBLIC_NAV_CV_REVIEW" },
] as const;

const RESOURCE_LINKS = [
  { href: "/privacy", i18nKey: "PUBLIC_FOOTER_PRIVACY" },
  { href: "/terms", i18nKey: "PUBLIC_FOOTER_TERMS" },
] as const;

export function PublicFooter() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-700/50 bg-depth-1 pb-8 pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer Grid */}
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Column 1: Logo + Tagline */}
          <div className="col-span-1">
            <div className="mb-6 flex items-center gap-2">
              <Waves className="size-8 text-ocean-1" aria-hidden="true" />
              <span className="text-2xl font-bold text-white">
                ZaikaConnect
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              {t("PUBLIC_FOOTER_TAGLINE")}
            </p>
          </div>

          {/* Column 2: For Job Seekers */}
          <div>
            <h3 className="mb-4 font-bold text-white">
              {t("PUBLIC_FOOTER_JOB_SEEKERS")}
            </h3>
            <ul className="space-y-3 text-sm text-slate-400">
              {JOB_SEEKER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="transition-colors hover:text-ocean-1"
                  >
                    {t(link.i18nKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h3 className="mb-4 font-bold text-white">
              {t("PUBLIC_FOOTER_RESOURCES")}
            </h3>
            <ul className="space-y-3 text-sm text-slate-400">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="transition-colors hover:text-ocean-1"
                  >
                    {t(link.i18nKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h3 className="mb-4 font-bold text-white">
              {t("PUBLIC_FOOTER_NEWSLETTER_TITLE")}
            </h3>
            <p className="mb-4 text-sm text-slate-400">
              {t("PUBLIC_FOOTER_NEWSLETTER_DESC")}
            </p>
            <form
              className="flex gap-2"
              onSubmit={(event) => event.preventDefault()}
            >
              <Input
                type="email"
                placeholder={t("PUBLIC_FOOTER_NEWSLETTER_PLACEHOLDER")}
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus-visible:border-ocean-1 focus-visible:ring-ocean-1/50"
              />
              <Button
                type="submit"
                className="shrink-0 bg-ocean-1 text-white hover:bg-ocean-2"
                size="icon"
              >
                <Send className="size-4" />
                <span className="sr-only">Subscribe</span>
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between border-t border-slate-800 pt-8 text-sm text-slate-500 md:flex-row">
          <p>{t("PUBLIC_FOOTER_COPYRIGHT", { year: currentYear })}</p>
          <div className="mt-4 flex items-center space-x-6 md:mt-0">
            <LanguageSwitcher variant="footer" />
            <Link to="/privacy" className="transition-colors hover:text-white">
              {t("PUBLIC_FOOTER_PRIVACY")}
            </Link>
            <Link to="/terms" className="transition-colors hover:text-white">
              {t("PUBLIC_FOOTER_TERMS")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
