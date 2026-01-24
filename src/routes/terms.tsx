import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { DEFAULT_SITE_NAME, seo } from "@/utils/seo";

export const Route = createFileRoute("/terms")({
  head: () => {
    const { meta, links } = seo({
      title: `Terms of Service - ${DEFAULT_SITE_NAME}`,
      description: "Terms and conditions for using Zaika Connect.",
      url: "/terms",
      canonicalUrl: "/terms",
      image: "/images/landing/landingpage.png",
    });

    return { meta, links };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  return <div>{t("TERMS_PLACEHOLDER")}</div>;
}
