import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  CalendarIcon,
  MapPinIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { PublicLayout } from "@/components/public/public-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ChatWidget } from "@/features/jobs/chat-widget";
import { JobDetail } from "@/features/jobs/job-detail";
import { formatDateShort } from "@/lib/format-date";
import { orpc } from "@/orpc/orpc-client";
import { DEFAULT_SITE_NAME, seo } from "@/utils/seo";

type LocationKey =
  | "LOCATION_REMOTE"
  | "LOCATION_BERLIN"
  | "LOCATION_MUNICH"
  | "LOCATION_HAMBURG"
  | "LOCATION_FRANKFURT"
  | "LOCATION_HYBRID";

type EmploymentTypeKey =
  | "EMPLOYMENT_TYPE_FULL_TIME"
  | "EMPLOYMENT_TYPE_PART_TIME"
  | "EMPLOYMENT_TYPE_CONTRACT"
  | "EMPLOYMENT_TYPE_FREELANCE";

type IndustryKey =
  | "INDUSTRY_TECHNOLOGY"
  | "INDUSTRY_FINANCE"
  | "INDUSTRY_HEALTHCARE"
  | "INDUSTRY_MARKETING"
  | "INDUSTRY_SALES"
  | "INDUSTRY_ENGINEERING"
  | "INDUSTRY_DESIGN"
  | "INDUSTRY_OPERATIONS";

function getLocationKey(location: string): LocationKey {
  return `LOCATION_${location.toUpperCase()}` as LocationKey;
}

function getEmploymentTypeKey(type: string): EmploymentTypeKey {
  return `EMPLOYMENT_TYPE_${type.toUpperCase().replace("-", "_")}` as EmploymentTypeKey;
}

function getIndustryKey(industry: string): IndustryKey {
  return `INDUSTRY_${industry.toUpperCase()}` as IndustryKey;
}

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
          <h2 className="text-2xl font-bold text-depth-1">
            {t("NOT_FOUND_TITLE")}
          </h2>
          <p className="mt-2 text-slate-500">{t("NOT_FOUND_DESC")}</p>
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
                id="job-detail-grid"
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
            <rect fill="url(#job-detail-grid)" width="100%" height="100%" />
          </svg>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link to="/jobs" className="mb-6 inline-block">
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

          {/* Job Title */}
          <h1 className="mb-4 font-display text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            {job.title}
          </h1>

          {/* Badges */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Badge className="border-0 bg-white/20 text-white backdrop-blur-sm">
              <MapPinIcon className="mr-1 size-3" aria-hidden="true" />
              {t(getLocationKey(job.location))}
            </Badge>
            <Badge className="border-0 bg-white/20 text-white backdrop-blur-sm">
              <BriefcaseIcon className="mr-1 size-3" aria-hidden="true" />
              {t(getEmploymentTypeKey(job.employmentType))}
            </Badge>
            <Badge className="border-0 bg-ocean-1/80 text-white backdrop-blur-sm">
              {t(getIndustryKey(job.industry))}
            </Badge>
          </div>

          {/* Posted Date */}
          <p className="flex items-center gap-2 text-sm text-slate-200">
            <CalendarIcon className="size-4" aria-hidden="true" />
            {t("JOBS_POSTED")} {formatDateShort(job.createdAt)}
          </p>
        </div>
      </section>

      {/* Job Content Section */}
      <section className="bg-background-light py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <JobDetail job={job} />
        </div>
      </section>

      <ChatWidget jobId={job.id} />
    </PublicLayout>
  );
}
