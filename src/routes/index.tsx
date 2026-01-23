import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BriefcaseIcon,
  FileTextIcon,
  MapPinIcon,
  SearchIcon,
  SparklesIcon,
  UploadIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { Spinner } from "@/components/ui/spinner";
import { Section } from "@/features/landing/landing-section";
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

function LandingPage() {
  const { t } = useTranslation();

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    ...orpc.jobs.list.queryOptions({
      input: {},
    }),
  });

  const featuredJobs = jobsData?.jobs.slice(0, 4) ?? [];

  const features = [
    {
      title: t("LANDING_CANDIDATE_FEATURE_1_TITLE"),
      description: t("LANDING_CANDIDATE_FEATURE_1_DESC"),
      icon: SearchIcon,
    },
    {
      title: t("LANDING_CANDIDATE_FEATURE_2_TITLE"),
      description: t("LANDING_CANDIDATE_FEATURE_2_DESC"),
      icon: SparklesIcon,
    },
    {
      title: t("LANDING_CANDIDATE_FEATURE_3_TITLE"),
      description: t("LANDING_CANDIDATE_FEATURE_3_DESC"),
      icon: UploadIcon,
    },
  ];

  return (
    <div className="min-h-screen scroll-smooth bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 right-0 left-0 z-50 border-border/40 border-b bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link className="flex items-center space-x-2" to="/">
              <Logo className="h-10 w-10 shadow-lg shadow-primary/20" />
              <span className="hidden font-bold text-2xl tracking-tight sm:inline">
                {DEFAULT_SITE_NAME}
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link
                className="hidden text-muted-foreground hover:text-foreground sm:inline-flex"
                to="/jobs"
              >
                {t("LANDING_NAV_JOBS")}
              </Link>
              <Link
                className="hidden text-muted-foreground hover:text-foreground sm:inline-flex"
                to="/cv-review"
              >
                {t("LANDING_NAV_CV_REVIEW")}
              </Link>
              <Button className="rounded-full bg-primary px-6 shadow-lg shadow-primary/20 hover:bg-primary/90">
                <Link className="flex items-center gap-2" to="/jobs">
                  {t("LANDING_NAV_FIND_JOB")}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-48 md:pb-32">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-linear-to-b from-primary/5 via-background to-background" />
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center">
          <Badge
            className="mb-8 border-primary/80 bg-primary p-4 font-medium text-primary-foreground text-sm hover:bg-primary/20"
            variant="outline"
          >
            {t("LANDING_HERO_BADGE")}
          </Badge>
          <h1 className="mb-8 text-balance font-black text-5xl tracking-tighter md:text-7xl lg:text-8xl">
            {t("LANDING_HERO_TITLE")}
          </h1>
          <p className="mx-auto mb-10 max-w-3xl text-balance font-light text-muted-foreground text-xl md:text-2xl">
            {t("LANDING_HERO_SUBTITLE")}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button className="h-14 rounded-full bg-primary px-10 font-semibold text-lg shadow-primary/25 shadow-xl transition-all duration-300 hover:shadow-primary/40">
              <Link className="flex items-center gap-2" to="/jobs">
                {t("LANDING_CTA_BROWSE_JOBS")}
                <ArrowRight className="ml-2 h-6 w-6" />
              </Link>
            </Button>
            <Button
              className="h-14 rounded-full border-border/60 px-10 font-medium text-lg transition-all hover:bg-accent/50"
              variant="outline"
            >
              <Link className="flex items-center gap-2" to="/cv-review">
                <FileTextIcon className="mr-2 h-5 w-5" />
                {t("LANDING_CTA_CV_REVIEW")}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <Section variant="muted">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-bold text-3xl md:text-4xl">
            {t("LANDING_CANDIDATES_TITLE")}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t("LANDING_CANDIDATES_SUBTITLE")}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <Card
              className="group border-border/40 bg-card/40 backdrop-blur-sm transition-colors hover:border-primary/40"
              key={feature.title}
            >
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* Featured Jobs Section */}
      <Section>
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-bold text-3xl md:text-4xl">
            {t("LANDING_FEATURED_JOBS_TITLE")}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t("LANDING_FEATURED_JOBS_SUBTITLE")}
          </p>
        </div>

        {jobsLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="size-8" />
          </div>
        ) : featuredJobs.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">{t("JOBS_EMPTY")}</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {featuredJobs.map((job) => (
              <Card
                className="flex flex-col transition-colors hover:border-primary/40"
                key={job.id}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <Badge variant="secondary">
                      {t(getEmploymentTypeKey(job.employmentType))}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <MapPinIcon className="size-4" />
                      {t(getLocationKey(job.location))}
                    </span>
                    <span className="flex items-center gap-1">
                      <BriefcaseIcon className="size-4" />
                      {job.industry}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="line-clamp-2 text-muted-foreground">
                    {job.description.slice(0, 150)}...
                  </p>
                </CardContent>
                <div className="flex justify-end gap-2 p-6 pt-0">
                  <Link to={`/jobs/${job.slug}`}>
                    <Button type="button" variant="outline">
                      {t("JOBS_VIEW_DETAILS")}
                    </Button>
                  </Link>
                  <Link to={`/apply/${job.slug}`}>
                    <Button type="button">{t("JOBS_APPLY_NOW")}</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Button className="rounded-full px-8" size="lg" variant="outline">
            <Link className="flex items-center gap-2" to="/jobs">
              {t("LANDING_VIEW_ALL_JOBS")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Section>

      {/* CV Review CTA Section */}
      <Section className="relative overflow-hidden" variant="subtle">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <FileTextIcon className="mx-auto mb-6 h-16 w-16 text-primary" />
          <h2 className="mb-6 font-bold text-3xl md:text-4xl">
            {t("LANDING_CV_REVIEW_TITLE")}
          </h2>
          <p className="mb-10 text-muted-foreground text-xl">
            {t("LANDING_CV_REVIEW_DESC")}
          </p>
          <Button
            className="h-14 rounded-full px-10 font-semibold text-lg shadow-primary/25 shadow-xl"
            size="lg"
          >
            <Link className="flex items-center gap-2" to="/cv-review">
              {t("LANDING_CV_REVIEW_CTA")}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </Section>

      {/* How It Works Section */}
      <Section>
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-bold text-3xl md:text-4xl">
            {t("LANDING_HOW_IT_WORKS_TITLE")}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-12 text-center md:grid-cols-3">
          <div className="flex flex-col items-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 font-bold text-2xl text-primary">
              1
            </div>
            <h3 className="mb-4 font-bold text-xl">
              {t("LANDING_STEP_1_TITLE")}
            </h3>
            <p className="text-muted-foreground">{t("LANDING_STEP_1_DESC")}</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 font-bold text-2xl text-primary">
              2
            </div>
            <h3 className="mb-4 font-bold text-xl">
              {t("LANDING_STEP_2_TITLE")}
            </h3>
            <p className="text-muted-foreground">{t("LANDING_STEP_2_DESC")}</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 font-bold text-2xl text-primary">
              3
            </div>
            <h3 className="mb-4 font-bold text-xl">
              {t("LANDING_STEP_3_TITLE")}
            </h3>
            <p className="text-muted-foreground">{t("LANDING_STEP_3_DESC")}</p>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="border-border/40 border-t bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Logo className="h-8 w-8" />
              <span className="font-bold">{DEFAULT_SITE_NAME}</span>
            </div>
            <div className="flex gap-6 text-muted-foreground text-sm">
              <Link className="hover:text-foreground" to="/jobs">
                {t("LANDING_NAV_JOBS")}
              </Link>
              <Link className="hover:text-foreground" to="/cv-review">
                {t("LANDING_NAV_CV_REVIEW")}
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-muted-foreground text-sm">
            <p>
              {new Date().getFullYear()} {DEFAULT_SITE_NAME}. {t("ALL_RIGHTS")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
