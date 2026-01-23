import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ApplicationForm } from "@/features/applications/application-form";
import { orpc } from "@/orpc/orpc-client";
import { DEFAULT_SITE_NAME, seo } from "@/utils/seo";

export const Route = createFileRoute("/apply/$jobSlug")({
  head: ({ params }) => {
    const { meta, links } = seo({
      title: `Apply - ${DEFAULT_SITE_NAME}`,
      description: "Submit your job application.",
      url: `/apply/${params.jobSlug}`,
      canonicalUrl: `/apply/${params.jobSlug}`,
    });
    return { meta, links };
  },
  component: ApplyPage,
});

function ApplyPage() {
  const { t } = useTranslation();
  const { jobSlug } = Route.useParams();

  const {
    data: job,
    isLoading,
    error,
  } = useQuery({
    ...orpc.jobs.getBySlug.queryOptions({
      input: { slug: jobSlug },
    }),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="flex justify-center py-12">
          <Spinner className="size-8" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="py-12 text-center">
          <h2 className="text-2xl font-bold">{t("NOT_FOUND_TITLE")}</h2>
          <p className="mt-2 text-muted-foreground">{t("NOT_FOUND_DESC")}</p>
          <Link to="/jobs">
            <Button type="button" className="mt-4" variant="outline">
              <ArrowLeftIcon className="mr-2 size-4" />
              {t("JOB_DETAIL_BACK")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link to="/jobs/$slug" params={{ slug: jobSlug }}>
          <Button type="button" variant="ghost" size="sm">
            <ArrowLeftIcon className="mr-2 size-4" />
            {t("JOB_DETAIL_BACK")}
          </Button>
        </Link>
      </div>

      <ApplicationForm jobSlug={jobSlug} jobTitle={job.title} />
    </div>
  );
}
