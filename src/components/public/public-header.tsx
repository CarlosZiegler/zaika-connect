import { Link } from "@tanstack/react-router";
import { Menu, Waves, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "@/components/public/language-switcher";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "/#services", i18nKey: "PUBLIC_NAV_SERVICES", isAnchor: true },
  {
    href: "/#for-companies",
    i18nKey: "PUBLIC_NAV_FOR_COMPANIES",
    isAnchor: true,
  },
  { href: "/#for-talents", i18nKey: "PUBLIC_NAV_FOR_TALENTS", isAnchor: true },
  { href: "/jobs", i18nKey: "PUBLIC_NAV_JOBS", isAnchor: false },
] as const;

export function PublicHeader() {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 right-0 left-0 z-50 bg-ocean-5">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <Waves className="size-8 text-ocean-1" aria-hidden="true" />
          <span className="text-xl font-semibold text-slate-200">
            ZaikaConnect
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) =>
            link.isAnchor ? (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium uppercase tracking-wide text-slate-200 transition-colors hover:text-white"
              >
                {t(link.i18nKey)}
              </a>
            ) : (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium uppercase tracking-wide text-slate-200 transition-colors hover:text-white"
              >
                {t(link.i18nKey)}
              </Link>
            )
          )}
          {/* Contact Link */}
          <Link
            to="/contact"
            className="text-sm font-medium uppercase tracking-wide text-slate-200 transition-colors hover:text-white"
          >
            {t("PUBLIC_NAV_CONTACT")}
          </Link>
        </div>

        {/* Desktop Auth Actions */}
        <div className="hidden items-center gap-4 md:flex">
          <LanguageSwitcher variant="header" />
          <Link
            to="/sign-in"
            className="text-sm font-medium uppercase tracking-wide text-slate-200 transition-colors hover:text-white"
          >
            {t("PUBLIC_NAV_LOGIN")}
          </Link>
        </div>

        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-200 hover:text-white md:hidden"
              />
            }
          >
            <Menu className="size-6" />
            <span className="sr-only">Open menu</span>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-full bg-ocean-5 sm:max-w-sm"
            showCloseButton={false}
          >
            <div className="flex h-full flex-col">
              {/* Mobile Header */}
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <SheetTitle className="flex items-center gap-2">
                  <Waves className="size-6 text-ocean-1" aria-hidden="true" />
                  <span className="text-lg font-semibold text-white">
                    ZaikaConnect
                  </span>
                </SheetTitle>
                <SheetClose
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-200 hover:text-white"
                    />
                  }
                >
                  <X className="size-6" />
                  <span className="sr-only">Close menu</span>
                </SheetClose>
              </div>

              {/* Mobile Nav Links */}
              <div className="flex flex-1 flex-col gap-1 p-4">
                {NAV_LINKS.map((link) =>
                  link.isAnchor ? (
                    <SheetClose
                      key={link.href}
                      render={
                        <a
                          href={link.href}
                          className="rounded-lg px-4 py-3 text-base font-medium uppercase tracking-wide text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
                        />
                      }
                    >
                      {t(link.i18nKey)}
                    </SheetClose>
                  ) : (
                    <SheetClose
                      key={link.href}
                      render={
                        <Link
                          to={link.href}
                          className="rounded-lg px-4 py-3 text-base font-medium uppercase tracking-wide text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
                        />
                      }
                    >
                      {t(link.i18nKey)}
                    </SheetClose>
                  )
                )}
                {/* Contact Link */}
                <SheetClose
                  render={
                    <Link
                      to="/contact"
                      className="rounded-lg px-4 py-3 text-base font-medium uppercase tracking-wide text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
                    />
                  }
                >
                  {t("PUBLIC_NAV_CONTACT")}
                </SheetClose>
              </div>

              {/* Mobile Auth Actions */}
              <div className="flex flex-col gap-3 border-t border-white/10 p-4">
                <div className="flex justify-center pb-2">
                  <LanguageSwitcher variant="header" />
                </div>
                <SheetClose
                  render={
                    <Link
                      to="/sign-in"
                      className="rounded-lg px-4 py-3 text-center text-base font-medium uppercase tracking-wide text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
                    />
                  }
                >
                  {t("PUBLIC_NAV_LOGIN")}
                </SheetClose>
                <SheetClose
                  render={
                    <Button
                      render={<Link to="/sign-up" />}
                      className="w-full bg-ocean-1 text-white hover:bg-ocean-2"
                      size="lg"
                    />
                  }
                >
                  {t("PUBLIC_NAV_SIGNUP")}
                </SheetClose>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
