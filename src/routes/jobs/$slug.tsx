import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ChatWidget } from "@/features/jobs/chat-widget";
import { JobDetail } from "@/features/jobs/job-detail";
import { orpc } from "@/orpc/orpc-client";
import { DEFAULT_SITE_NAME, seo } from "@/utils/seo";

export const Route = createFileRoute("/jobs/$slug")({
  head: ({ params }) => {
    const { meta, links } = seo({
      title: `Job Details - ${DEFAULT_SITE_NAME}`,
      description: "View job details and apply for this position.",
      url: `/jobs/${params.slug}`,
      canonicalUrl: `/jobs/${params.slug}`,
    });
    return { meta, links };
  },
  component: JobDetailPage,
});

function JobDetailPage() {
  const { t } = useTranslation();
  const { slug } = Route.useParams();

  const {
    data: job,
    isLoading,
    error,
  } = useQuery({
    ...orpc.jobs.getBySlug.queryOptions({
      input: { slug },
    }),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex justify-center py-12">
          <Spinner className="size-8" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
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
    <>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link to="/jobs">
            <Button type="button" variant="ghost" size="sm">
              <ArrowLeftIcon className="mr-2 size-4" />
              {t("JOB_DETAIL_BACK")}
            </Button>
          </Link>
        </div>

        <JobDetail job={job} />
      </div>

      <ChatWidget jobId={job.id} />
    </>
  );
}
