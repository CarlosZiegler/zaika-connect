import {
  CheckCircle2Icon,
  DollarSignIcon,
  SparklesIcon,
  TargetIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Main Content */}
      <div className="space-y-8 lg:col-span-2">
        {/* About Section */}
        <Card className="overflow-hidden border-slate-100 bg-white shadow-md">
          <div className="h-1 bg-ocean-1" />
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl text-depth-1">
              <div className="flex size-8 items-center justify-center rounded-lg bg-ocean-1/10 text-ocean-1">
                <SparklesIcon className="size-4" aria-hidden="true" />
              </div>
              {t("JOB_DETAIL_ABOUT")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-slate-600">
              {renderTextWithLineBreaks(job.description)}
            </div>
          </CardContent>
        </Card>

        {/* Requirements Section */}
        {job.requirements ? (
          <Card className="overflow-hidden border-slate-100 bg-white shadow-md">
            <div className="h-1 bg-ocean-3" />
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl text-depth-1">
                <div className="flex size-8 items-center justify-center rounded-lg bg-ocean-3/10 text-ocean-3">
                  <TargetIcon className="size-4" aria-hidden="true" />
                </div>
                {t("JOB_DETAIL_REQUIREMENTS")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-slate-600">
                {renderTextWithLineBreaks(job.requirements)}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Benefits Section */}
        {job.benefits ? (
          <Card className="overflow-hidden border-slate-100 bg-white shadow-md">
            <div className="h-1 bg-depth-5" />
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl text-depth-1">
                <div className="flex size-8 items-center justify-center rounded-lg bg-depth-5/10 text-depth-5">
                  <CheckCircle2Icon className="size-4" aria-hidden="true" />
                </div>
                {t("JOB_DETAIL_BENEFITS")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-slate-600">
                {renderTextWithLineBreaks(job.benefits)}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Apply Now Card */}
        <Card className="sticky top-24 overflow-hidden border-slate-100 bg-white shadow-md">
          <div className="h-1 bg-ocean-1" />
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-depth-1">
              {t("JOBS_APPLY_NOW")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {salary ? (
              <div className="flex items-center gap-2 rounded-lg bg-ocean-1/10 p-3 text-ocean-5">
                <DollarSignIcon className="size-5" aria-hidden="true" />
                <span className="font-semibold">{salary}</span>
              </div>
            ) : null}
            <a href={`/apply/${job.slug}`}>
              <Button
                type="button"
                className="w-full bg-ocean-1 text-white hover:bg-ocean-2"
                size="lg"
              >
                {t("JOBS_APPLY_NOW")}
              </Button>
            </a>
            <p className="text-center text-xs text-slate-500">
              {t("JOB_DETAIL_APPLY_DESC")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
