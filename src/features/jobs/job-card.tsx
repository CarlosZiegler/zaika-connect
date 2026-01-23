import { BriefcaseIcon, CalendarIcon, MapPinIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateShort } from "@/lib/format-date";

type Job = {
  id: string;
  slug: string;
  title: string;
  description: string;
  location: string;
  employmentType: string;
  industry: string;
  salaryMin: number | null;
  salaryMax: number | null;
  createdAt: Date;
};

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  if (min && max) {
    return `€${min.toLocaleString()} - €${max.toLocaleString()}`;
  }
  if (min) return `From €${min.toLocaleString()}`;
  return `Up to €${max?.toLocaleString()}`;
}

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

type JobCardProps = {
  job: Job;
};

export function JobCard({ job }: JobCardProps) {
  const { t } = useTranslation();
  const salary = formatSalary(job.salaryMin, job.salaryMax);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{job.title}</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-4">
              <span className="flex items-center gap-1">
                <MapPinIcon className="size-4" />
                {t(getLocationKey(job.location))}
              </span>
              <span className="flex items-center gap-1">
                <BriefcaseIcon className="size-4" />
                {t(getEmploymentTypeKey(job.employmentType))}
              </span>
            </CardDescription>
          </div>
          <Badge variant="secondary">{t(getIndustryKey(job.industry))}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="line-clamp-3 text-muted-foreground">
          {job.description.slice(0, 200)}...
        </p>
        {salary ? <p className="mt-2 font-medium">{salary}</p> : null}
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <CalendarIcon className="size-4" />
          {t("JOBS_POSTED")} {formatDateShort(job.createdAt)}
        </span>
        <div className="flex gap-2">
          <a href={`/jobs/${job.slug}`}>
            <Button type="button" variant="outline">
              {t("JOBS_VIEW_DETAILS")}
            </Button>
          </a>
          <a href={`/apply/${job.slug}`}>
            <Button type="button">{t("JOBS_APPLY_NOW")}</Button>
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
