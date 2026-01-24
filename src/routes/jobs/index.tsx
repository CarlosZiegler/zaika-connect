import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BriefcaseIcon,
  ExternalLink,
  Filter,
  MapPinIcon,
  Search,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { PublicLayout } from "@/components/public/public-layout";
import { SearchHero } from "@/components/public/search-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  type EmploymentType,
  EMPLOYMENT_TYPES,
  INDUSTRIES,
  type Industry,
  type Location,
  LOCATIONS,
} from "@/lib/constants/recruiting";
import { orpc } from "@/orpc/orpc-client";
import { DEFAULT_SITE_NAME, seo } from "@/utils/seo";

const jobsSearchSchema = z.object({
  q: z.string().optional(),
  location: z.string().optional(),
  locationFilter: z.string().optional(),
  employmentType: z.string().optional(),
  industry: z.string().optional(),
});

export const Route = createFileRoute("/jobs/")({
  validateSearch: jobsSearchSchema,
  head: () => {
    const { meta, links } = seo({
      title: `Open Positions - ${DEFAULT_SITE_NAME}`,
      description: "Browse open positions and find your next opportunity.",
      url: "/jobs",
      canonicalUrl: "/jobs",
    });
    return { meta, links };
  },
  component: JobsPage,
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

// Border colors for job cards - matching landing page
const CARD_BORDER_COLORS = ["bg-ocean-1", "bg-depth-5", "bg-ocean-3"] as const;

function JobsPage() {
  const { t } = useTranslation();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  // Build filters from search params
  // Combine q (keyword search) and location (free text) into search query
  const searchTerms = [search.q, search.location].filter(Boolean).join(" ");

  const filters = {
    search: searchTerms || undefined,
    location: search.locationFilter,
    employmentType: search.employmentType,
    industry: search.industry,
  };

  const { data, isLoading } = useQuery({
    ...orpc.jobs.list.queryOptions({
      input: filters,
    }),
  });

  const handleFilterChange = (key: string, value: string | null) => {
    navigate({
      search: (prev) => ({
        ...prev,
        [key]: value === "all" || !value ? undefined : value,
      }),
      replace: true,
    });
  };

  const handleClearFilters = () => {
    navigate({
      search: {
        q: search.q,
        location: search.location,
      },
      replace: true,
    });
  };

  const handleClearAll = () => {
    navigate({
      search: {},
      replace: true,
    });
  };

  const hasFilters =
    search.locationFilter ?? search.employmentType ?? search.industry;

  const jobs = data?.jobs ?? [];

  return (
    <PublicLayout>
      {/* Hero Section - smaller than landing page */}
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
                id="jobs-grid"
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
            <rect fill="url(#jobs-grid)" width="100%" height="100%" />
          </svg>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-4 font-display text-4xl font-bold text-white md:text-5xl">
            {t("JOBS_TITLE")}
          </h1>
          <p className="mx-auto mb-6 max-w-2xl text-lg text-slate-200">
            {t("JOBS_SUBTITLE")}
          </p>

          {/* Search Hero Component - no trust badges on jobs page */}
          <SearchHero
            defaultKeyword={search.q ?? ""}
            defaultLocation={search.location ?? ""}
            showTrustBadges={false}
          />
        </div>
      </section>

      {/* Filters Section */}
      <section className="border-b border-slate-200 bg-white py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filters Label */}
            <div className="flex items-center gap-1.5 text-ocean-5">
              <Filter className="size-4" aria-hidden="true" />
              <span className="text-sm font-medium">{t("JOBS_FILTERS")}</span>
            </div>

            {/* Location Filter */}
            <Select
              value={search.locationFilter ?? "all"}
              onValueChange={(v) => handleFilterChange("locationFilter", v)}
            >
              <SelectTrigger className="h-8 w-[130px] border-slate-200 bg-slate-50 text-xs focus:border-ocean-1 focus:ring-ocean-1">
                <MapPinIcon className="mr-1 size-3 text-slate-400" />
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {LOCATIONS.map((loc: Location) => (
                  <SelectItem key={loc} value={loc}>
                    {t(getLocationKey(loc))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Employment Type Filter */}
            <Select
              value={search.employmentType ?? "all"}
              onValueChange={(v) => handleFilterChange("employmentType", v)}
            >
              <SelectTrigger className="h-8 w-[130px] border-slate-200 bg-slate-50 text-xs focus:border-ocean-1 focus:ring-ocean-1">
                <BriefcaseIcon className="mr-1 size-3 text-slate-400" />
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {EMPLOYMENT_TYPES.map((type: EmploymentType) => (
                  <SelectItem key={type} value={type}>
                    {t(getEmploymentTypeKey(type))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Industry Filter */}
            <Select
              value={search.industry ?? "all"}
              onValueChange={(v) => handleFilterChange("industry", v)}
            >
              <SelectTrigger className="h-8 w-[130px] border-slate-200 bg-slate-50 text-xs focus:border-ocean-1 focus:ring-ocean-1">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All industries</SelectItem>
                {INDUSTRIES.map((ind: Industry) => (
                  <SelectItem key={ind} value={ind}>
                    {t(getIndustryKey(ind))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Divider */}
            {(search.q ?? search.location ?? hasFilters) ? (
              <div className="h-6 w-px bg-slate-200" />
            ) : null}

            {/* Active Search Badges */}
            {search.q ? (
              <Badge
                variant="secondary"
                className="flex h-7 items-center gap-1 bg-ocean-1/10 px-2 text-xs text-ocean-5"
              >
                <Search className="size-3" aria-hidden="true" />
                {search.q}
                <button
                  type="button"
                  onClick={() => handleFilterChange("q", null)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-ocean-1/20"
                  aria-label={`Remove keyword filter: ${search.q}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ) : null}
            {search.location ? (
              <Badge
                variant="secondary"
                className="flex h-7 items-center gap-1 bg-ocean-1/10 px-2 text-xs text-ocean-5"
              >
                <MapPinIcon className="size-3" aria-hidden="true" />
                {search.location}
                <button
                  type="button"
                  onClick={() => handleFilterChange("location", null)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-ocean-1/20"
                  aria-label={`Remove location filter: ${search.location}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ) : null}

            {/* Clear All Button */}
            {(search.q ?? search.location ?? hasFilters) ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-7 gap-1 px-2 text-xs text-slate-500 hover:text-ocean-5"
              >
                <X className="size-3" aria-hidden="true" />
                Clear all
              </Button>
            ) : null}

            {/* Results count */}
            {!isLoading && (
              <span className="ml-auto text-xs text-slate-500">
                {jobs.length} {jobs.length === 1 ? "position" : "positions"}{" "}
                found
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Jobs List Section */}
      <section className="bg-background-light py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner className="size-10" />
            </div>
          ) : jobs.length === 0 ? (
            /* Empty State */
            <div className="py-16 text-center">
              <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-ocean-1/10">
                <Search className="size-10 text-ocean-1" aria-hidden="true" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-depth-1">
                {t("JOBS_EMPTY")}
              </h3>
              <p className="mt-2 text-slate-500">{t("JOBS_EMPTY_SUBTITLE")}</p>
              {hasFilters ? (
                <Button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-6 bg-ocean-5 hover:bg-ocean-4"
                >
                  {t("JOBS_FILTER_CLEAR")}
                </Button>
              ) : null}
            </div>
          ) : (
            /* Job Cards Grid */
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job, index) => (
                <div
                  key={job.id}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-md transition hover:shadow-xl"
                >
                  {/* Colored Left Border */}
                  <div
                    className={`absolute top-0 left-0 h-full w-1 ${CARD_BORDER_COLORS[index % CARD_BORDER_COLORS.length]}`}
                  />

                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex size-12 items-center justify-center rounded-lg bg-slate-100 text-ocean-5">
                      <BriefcaseIcon className="size-6" aria-hidden="true" />
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-teal-50 text-teal-700"
                    >
                      {t(getEmploymentTypeKey(job.employmentType))}
                    </Badge>
                  </div>

                  {/* Job Title */}
                  <h3 className="mt-4 text-xl font-bold text-slate-900 transition group-hover:text-ocean-1">
                    {job.title}
                  </h3>

                  {/* Company & Location */}
                  <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                    <MapPinIcon className="size-4" aria-hidden="true" />
                    {t(getLocationKey(job.location))}
                    <span className="mx-2">|</span>
                    {job.industry}
                  </p>

                  {/* Description Preview */}
                  <p className="mt-4 line-clamp-2 text-sm text-slate-600">
                    {job.description.slice(0, 120)}...
                  </p>

                  {/* Card Footer */}
                  <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
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
    </PublicLayout>
  );
}
