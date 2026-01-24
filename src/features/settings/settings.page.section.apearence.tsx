"use client";

import { useTranslation } from "react-i18next";

import { LanguageSwitch } from "@/components/language-switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AppearanceSection() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 px-4">
      <div>
        <h1 className="text-balance font-semibold text-2xl">
          {t("SETTINGS_APPEARANCE_TITLE_FULL")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("SETTINGS_APPEARANCE_DESC")}
        </p>
      </div>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("LANGUAGE")}</CardTitle>
          <CardDescription>{t("SETTINGS_LANGUAGE_DESC")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LanguageSwitch />
        </CardContent>
      </Card>
    </div>
  );
}
