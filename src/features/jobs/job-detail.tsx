import {
  BriefcaseIcon,
  CalendarIcon,
  DollarSignIcon,
  MapPinIcon,
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
import { Separator } from "@/components/ui/separator";
import { formatDateShort } from "@/lib/format-date";

type Job = {
  id: string;
  slug: string;
  title: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  location: string;
  employmentType: string;
  industry: string;
  salaryMin: number | null;
  salaryMax: number | null;
  createdAt: Date;
};

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

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) {
    return null;
  }
  if (min && max) {
    return `${min.toLocaleString()} - ${max.toLocaleString()}`;
  }
  if (min) {
    return `From ${min.toLocaleString()}`;
  }
  return `Up to ${max?.toLocaleString()}`;
}

function renderTextWithLineBreaks(text: string) {
  return text.split("\n").map((line, index, array) => (
    <span key={`line-${line.slice(0, 20)}-${index}`}>
      {line}
      {index < array.length - 1 ? <br /> : null}
    </span>
  ));
}

type JobDetailProps = {
  job: Job;
};

export function JobDetail({ job }: JobDetailProps) {
  const { t } = useTranslation();
  const salary = formatSalary(job.salaryMin, job.salaryMax);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-2xl sm:text-3xl">
                  {job.title}
                </CardTitle>
                <CardDescription className="mt-2 flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="size-4" />
                    {t(getLocationKey(job.location))}
                  </span>
                  <span className="flex items-center gap-1">
                    <BriefcaseIcon className="size-4" />
                    {t(getEmploymentTypeKey(job.employmentType))}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="size-4" />
                    {t("JOBS_POSTED")} {formatDateShort(job.createdAt)}
                  </span>
                </CardDescription>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {t(getIndustryKey(job.industry))}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {salary ? (
              <div className="flex items-center gap-2 text-lg font-semibold">
                <DollarSignIcon className="size-5" />
                <span>{salary}</span>
              </div>
            ) : null}

            <Separator />

            <section>
              <h3 className="mb-3 text-lg font-semibold">
                {t("JOB_DETAIL_ABOUT")}
              </h3>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                {renderTextWithLineBreaks(job.description)}
              </div>
            </section>

            {job.requirements ? (
              <>
                <Separator />
                <section>
                  <h3 className="mb-3 text-lg font-semibold">
                    {t("JOB_DETAIL_REQUIREMENTS")}
                  </h3>
                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    {renderTextWithLineBreaks(job.requirements)}
                  </div>
                </section>
              </>
            ) : null}

            {job.benefits ? (
              <>
                <Separator />
                <section>
                  <h3 className="mb-3 text-lg font-semibold">
                    {t("JOB_DETAIL_BENEFITS")}
                  </h3>
                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    {renderTextWithLineBreaks(job.benefits)}
                  </div>
                </section>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("JOBS_APPLY_NOW")}</CardTitle>
          </CardHeader>
          <CardContent>
            <a href={`/apply/${job.slug}`}>
              <Button type="button" className="w-full" size="lg">
                {t("JOBS_APPLY_NOW")}
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
