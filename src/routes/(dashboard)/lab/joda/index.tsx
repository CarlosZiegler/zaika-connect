import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { JodaPage } from "@/features/lab/joda/joda.page";

export const Route = createFileRoute("/(dashboard)/lab/joda/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { i18n } = useTranslation();

  // Key forces complete remount when language changes,
  // which reloads the correct js-joda locale package
  return <JodaPage key={i18n.language} />;
}
