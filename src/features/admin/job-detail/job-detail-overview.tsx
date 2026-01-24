"use client";

import {
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  DollarSignIcon,
  MapPinIcon,
  SparklesIcon,
} from "lucide-react";

import { MessageResponse } from "@/components/ai-elements/message";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Job = {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  location: string;
  employmentType: string;
  industry: string;
  salaryMin: number | null;
  salaryMax: number | null;
  isActive: boolean;
  createdAt: Date;
};

type JobDetailOverviewProps = {
  job: Job;
};

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()}`;
  if (min) return `From ${min.toLocaleString()}`;
  return `Up to ${max?.toLocaleString()}`;
}

export function JobDetailOverview({ job }: JobDetailOverviewProps) {
  const salary = formatSalary(job.salaryMin, job.salaryMax);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Content */}
      <div className="space-y-6 lg:col-span-2">
        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SparklesIcon className="size-5 text-ocean-1" />
              About This Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <MessageResponse>{job.description}</MessageResponse>
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        {job.requirements ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BriefcaseIcon className="size-5 text-ocean-3" />
                Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <MessageResponse>{job.requirements}</MessageResponse>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Benefits */}
        {job.benefits ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SparklesIcon className="size-5 text-green-600" />
                Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <MessageResponse>{job.benefits}</MessageResponse>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPinIcon className="size-5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-sm">Location</p>
                <p className="font-medium">{job.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BriefcaseIcon className="size-5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-sm">Employment Type</p>
                <p className="font-medium">{job.employmentType}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BuildingIcon className="size-5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-sm">Industry</p>
                <p className="font-medium">{job.industry}</p>
              </div>
            </div>
            {salary ? (
              <div className="flex items-center gap-3">
                <DollarSignIcon className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-sm">Salary</p>
                  <p className="font-medium">{salary}</p>
                </div>
              </div>
            ) : null}
            <div className="flex items-center gap-3">
              <CalendarIcon className="size-5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-sm">Created</p>
                <p className="font-medium">
                  {new Date(job.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="pt-2">
              <Badge variant={job.isActive ? "default" : "secondary"}>
                {job.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
