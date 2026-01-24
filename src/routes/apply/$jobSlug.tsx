import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PublicLayout } from "@/components/public/public-layout";
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
      <PublicLayout>
        <div className="flex justify-center py-24">
          <Spinner className="size-10" />
        </div>
      </PublicLayout>
    );
  }

  if (error || !job) {
    return (
      <PublicLayout>
        <div className="py-24 text-center">
          <h2 className="text-2xl font-bold text-depth-1 dark:text-white">
            {t("NOT_FOUND_TITLE")}
          </h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            {t("NOT_FOUND_DESC")}
          </p>
          <Link to="/jobs">
            <Button
              type="button"
              className="mt-6 bg-ocean-1 hover:bg-ocean-2"
              variant="default"
            >
              <ArrowLeftIcon className="mr-2 size-4" />
              {t("JOB_DETAIL_BACK")}
            </Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-ocean-4 pt-24 pb-12">
        {/* Subtle Grid Background */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-10">
          <svg
            width="100%"
            height="100%"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <title>Background Grid</title>
            <defs>
              <pattern
                id="apply-page-grid"
                width="80"
                height="80"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 80 0 L 0 0 0 80"
                  fill="none"
                  stroke="white"
                  strokeOpacity="0.3"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect fill="url(#apply-page-grid)" width="100%" height="100%" />
          </svg>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link
            to="/jobs/$slug"
            params={{ slug: jobSlug }}
            className="mb-6 inline-block"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-white/80 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeftIcon className="mr-2 size-4" />
              {t("JOB_DETAIL_BACK")}
            </Button>
          </Link>

          {/* Page Title */}
          <h1 className="font-display text-3xl font-bold text-white md:text-4xl">
            {t("APPLICATION_APPLY_FOR")} {job.title}
          </h1>
        </div>
      </section>

      {/* Form Section */}
      <section className="bg-background-light py-12 dark:bg-background">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <ApplicationForm jobSlug={jobSlug} jobTitle={job.title} />
        </div>
      </section>
    </PublicLayout>
  );
}
