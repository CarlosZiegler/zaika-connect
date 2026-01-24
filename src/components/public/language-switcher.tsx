import { GlobeIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Language } from "@/lib/intl/resources";

const LANGUAGES = [
  { code: "de", i18nKey: "LANGUAGE_DE" },
  { code: "en", i18nKey: "LANGUAGE_EN" },
] as const;

type LanguageSwitcherProps = {
  variant?: "header" | "footer";
};

export function LanguageSwitcher({ variant = "footer" }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language as Language;

  const handleLanguageChange = (lang: Language) => {
    i18n.changeLanguage(lang);
  };

  const isHeader = variant === "header";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={
              isHeader
                ? "gap-2 text-slate-200 hover:bg-white/10 hover:text-white"
                : "gap-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            }
          />
        }
      >
        <GlobeIcon className="size-4" aria-hidden="true" />
        <span className="text-sm uppercase">{currentLanguage}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="border-slate-200 bg-white shadow-lg"
      >
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code as Language)}
            className={`cursor-pointer ${
              currentLanguage === lang.code
                ? "!bg-ocean-1 font-medium !text-white hover:!bg-ocean-2"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            {t(lang.i18nKey)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
