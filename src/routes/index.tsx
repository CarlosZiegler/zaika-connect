import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart2,
  BriefcaseIcon,
  ExternalLink,
  FileText,
  MapPinIcon,
  Network,
  Upload,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { PublicLayout } from "@/components/public/public-layout";
import { SearchHero } from "@/components/public/search-hero";
import { StatsSection } from "@/components/public/stats-section";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { orpc } from "@/orpc/orpc-client";
import { DEFAULT_SITE_NAME, SITE_URL, seo } from "@/utils/seo";

export const Route = createFileRoute("/")({
  head: () => {
    const title = `${DEFAULT_SITE_NAME} - Find Your Next Opportunity`;
    const description =
      "Connect with top companies and discover jobs that match your skills. Get instant AI feedback on your CV.";

    const { meta, links } = seo({
      title,
      description,
      keywords:
        "jobs, careers, recruiting, job search, CV review, AI matching, employment",
      url: "/",
      canonicalUrl: "/",
    });

    const jsonLd = [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: DEFAULT_SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/android-chrome-512x512.png`,
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: DEFAULT_SITE_NAME,
        url: SITE_URL,
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/jobs?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ];

    return {
      meta,
      links,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(jsonLd),
        },
      ],
    };
  },
  component: LandingPage,
});

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

function getLocationKey(location: string): LocationKey {
  return `LOCATION_${location.toUpperCase()}` as LocationKey;
}

function getEmploymentTypeKey(type: string): EmploymentTypeKey {
  return `EMPLOYMENT_TYPE_${type.toUpperCase().replace("-", "_")}` as EmploymentTypeKey;
}

// Border colors for job cards
const CARD_BORDER_COLORS = ["bg-ocean-1", "bg-depth-5", "bg-ocean-3"] as const;

function LandingPage() {
  const { t } = useTranslation();

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    ...orpc.jobs.list.queryOptions({
      input: {},
    }),
  });

  const featuredJobs = jobsData?.jobs.slice(0, 3) ?? [];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-ocean-5 pt-32 pb-20 lg:pt-48 lg:pb-32">
        {/* Animated Grid Background */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-20">
          <svg
            width="100%"
            height="100%"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <title>Background Grid</title>
            <defs>
              <pattern
                id="grid"
                width="100"
                height="100"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 100 0 L 0 0 0 100"
                  fill="none"
                  stroke="white"
                  strokeOpacity="0.2"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect fill="url(#grid)" width="100%" height="100%" />
            {/* Data visualization nodes */}
            <circle
              cx="10%"
              cy="20%"
              r="2"
              fill="rgba(255,255,255,0.15)"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="0.5"
            />
            <circle
              cx="85%"
              cy="35%"
              r="3"
              fill="rgba(255,255,255,0.15)"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="0.5"
            />
            <circle
              cx="45%"
              cy="75%"
              r="4"
              fill="rgba(255,255,255,0.15)"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="0.5"
            />
            <circle
              cx="20%"
              cy="60%"
              r="2"
              fill="rgba(255,255,255,0.15)"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="0.5"
            />
            {/* Connecting lines */}
            <line
              x1="10%"
              y1="20%"
              x2="85%"
              y2="35%"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="0.5"
            />
            <line
              x1="85%"
              y1="35%"
              x2="45%"
              y2="75%"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="0.5"
            />
            <line
              x1="45%"
              y1="75%"
              x2="20%"
              y2="60%"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="0.5"
            />
            <line
              x1="20%"
              y1="60%"
              x2="10%"
              y2="20%"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="0.5"
            />
          </svg>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-6 font-display text-5xl font-bold leading-tight text-white md:text-7xl">
            {t("LANDING_HERO_TITLE_NEW")}
          </h1>
          <div className="mx-auto mb-8 max-w-3xl">
            <h2 className="mb-4 text-xl font-semibold text-teal-300 md:text-2xl">
              {t("LANDING_HERO_SUBTITLE_NEW")}
            </h2>
            <p className="text-lg leading-relaxed text-slate-200">
              {t("LANDING_HERO_DESC")}
            </p>
          </div>

          {/* Search Hero Component */}
          <SearchHero />
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection />

      {/* Featured Jobs Section */}
      <section className="bg-background-light py-20 dark:bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold text-depth-1 dark:text-white">
                {t("LANDING_FEATURED_TITLE")}
              </h2>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                {t("LANDING_FEATURED_SUBTITLE")}
              </p>
            </div>
            <Link
              to="/jobs"
              className="flex items-center gap-1 font-medium text-ocean-1 hover:underline"
            >
              {t("LANDING_VIEW_ALL")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          {/* Job Cards Grid */}
          {jobsLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="size-8" />
            </div>
          ) : featuredJobs.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-500 dark:text-slate-400">
                {t("JOBS_EMPTY")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredJobs.map((job, index) => (
                <div
                  key={job.id}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-md transition hover:shadow-xl dark:border-slate-700 dark:bg-depth-1"
                >
                  {/* Colored Left Border */}
                  <div
                    className={`absolute top-0 left-0 h-full w-1 ${CARD_BORDER_COLORS[index % CARD_BORDER_COLORS.length]}`}
                  />

                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex size-12 items-center justify-center rounded-lg bg-slate-100 text-ocean-5 dark:bg-slate-700">
                      <BriefcaseIcon className="size-6" aria-hidden="true" />
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                    >
                      {t(getEmploymentTypeKey(job.employmentType))}
                    </Badge>
                  </div>

                  {/* Job Title */}
                  <h3 className="mt-4 text-xl font-bold text-slate-900 transition group-hover:text-ocean-1 dark:text-white">
                    {job.title}
                  </h3>

                  {/* Company & Location */}
                  <p className="mt-1 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                    <MapPinIcon className="size-4" aria-hidden="true" />
                    {t(getLocationKey(job.location))}
                    <span className="mx-2">|</span>
                    {job.industry}
                  </p>

                  {/* Description Preview */}
                  <p className="mt-4 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                    {job.description.slice(0, 120)}...
                  </p>

                  {/* Card Footer */}
                  <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4 dark:border-slate-800">
                    <span className="text-xs text-slate-400">
                      {t("JOBS_POSTED")} recently
                    </span>
                    <Link
                      to="/jobs/$slug"
                      params={{ slug: job.slug }}
                      className={`flex size-8 items-center justify-center rounded-full text-white ${CARD_BORDER_COLORS[index % CARD_BORDER_COLORS.length]}`}
                    >
                      <ExternalLink className="size-4" aria-hidden="true" />
                      <span className="sr-only">View {job.title}</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CV CTA Section */}
      <section className="relative overflow-hidden bg-depth-3 py-20">
        {/* Dot Pattern Background */}
        <div className="absolute inset-0 opacity-5">
          <svg
            width="100%"
            height="100%"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <title>Background Pattern</title>
            <defs>
              <pattern
                id="dotPattern"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1" fill="white" />
              </pattern>
            </defs>
            <rect fill="url(#dotPattern)" width="100%" height="100%" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="glass-panel flex flex-col items-center justify-between gap-10 rounded-3xl p-10 text-center md:flex-row md:p-16 md:text-left">
            {/* Content */}
            <div className="md:w-2/3">
              <h2 className="mb-4 font-display text-3xl font-bold text-white md:text-4xl">
                {t("LANDING_CV_TITLE")}
              </h2>
              <p className="mb-8 text-lg text-teal-100">
                {t("LANDING_CV_DESC")}
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/cv-review"
                  className="flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3 font-bold text-ocean-5 shadow-lg transition hover:bg-teal-50"
                >
                  <Upload className="size-5" aria-hidden="true" />
                  {t("LANDING_CV_CTA")}
                </Link>
                <Link
                  to="/jobs"
                  className="flex items-center justify-center rounded-xl border border-white bg-transparent px-8 py-3 font-bold text-white transition hover:bg-white/10"
                >
                  {t("LANDING_CV_EXPLORE")}
                </Link>
              </div>
            </div>

            {/* Decorative Card Illustration */}
            <div className="flex justify-center md:w-1/3">
              <div className="relative h-64 w-48 rotate-6 transform rounded-xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-md transition duration-500 hover:rotate-0">
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-teal-200">
                  <FileText
                    className="size-6 text-ocean-5"
                    aria-hidden="true"
                  />
                </div>
                <div className="mb-2 h-2 w-24 rounded bg-white/50" />
                <div className="mb-6 h-2 w-32 rounded bg-white/30" />
                <div className="space-y-2">
                  <div className="h-1.5 w-full rounded bg-white/20" />
                  <div className="h-1.5 w-full rounded bg-white/20" />
                  <div className="h-1.5 w-20 rounded bg-white/20" />
                </div>
                <div className="absolute -right-6 -bottom-6 flex items-center gap-2 rounded-lg bg-ocean-1 p-3 text-sm font-bold text-white shadow-lg">
                  <FileText className="size-4" aria-hidden="true" />
                  AI Reviewed
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Section */}
      <section className="bg-white py-24 dark:bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-16 md:flex-row">
            {/* Image Placeholder */}
            <div className="relative md:w-1/2">
              <div className="relative z-10 flex h-[500px] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-ocean-4 to-depth-3 shadow-2xl">
                <div className="text-center text-white">
                  <Network
                    className="mx-auto mb-4 size-24 opacity-50"
                    aria-hidden="true"
                  />
                  <p className="text-lg font-medium opacity-75">
                    Enterprise Solutions
                  </p>
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 z-0 hidden h-full w-full rounded-2xl border-2 border-ocean-1 md:block" />
            </div>

            {/* Content */}
            <div className="md:w-1/2">
              <span className="mb-3 text-xs font-bold uppercase tracking-widest text-ocean-1">
                {t("LANDING_ENTERPRISE_LABEL")}
              </span>
              <h2 className="mb-6 font-display text-4xl font-bold leading-snug text-depth-1 dark:text-white">
                {t("LANDING_ENTERPRISE_TITLE")}
              </h2>
              <p className="mb-8 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                {t("LANDING_ENTERPRISE_DESC")}
              </p>

              {/* Feature List */}
              <ul className="mb-10 space-y-4">
                <li className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                  <BarChart2
                    className="mt-1 size-5 text-ocean-1"
                    aria-hidden="true"
                  />
                  <div>
                    <span className="font-bold">
                      {t("LANDING_ENTERPRISE_FEATURE_1_TITLE")}
                    </span>
                    <p className="text-sm opacity-80">
                      {t("LANDING_ENTERPRISE_FEATURE_1_DESC")}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                  <Network
                    className="mt-1 size-5 text-ocean-1"
                    aria-hidden="true"
                  />
                  <div>
                    <span className="font-bold">
                      {t("LANDING_ENTERPRISE_FEATURE_2_TITLE")}
                    </span>
                    <p className="text-sm opacity-80">
                      {t("LANDING_ENTERPRISE_FEATURE_2_DESC")}
                    </p>
                  </div>
                </li>
              </ul>

              <Link
                to="/jobs"
                className="inline-block rounded-xl bg-depth-5 px-8 py-3 font-bold text-white shadow-lg shadow-depth-5/20 transition hover:bg-depth-4"
              >
                {t("LANDING_ENTERPRISE_CTA")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
