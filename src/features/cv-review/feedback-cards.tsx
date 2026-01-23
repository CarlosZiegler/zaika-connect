import {
  AlertTriangleIcon,
  BookOpenIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  GraduationCapIcon,
  LightbulbIcon,
  SparklesIcon,
  XCircleIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type { CVAnalysis } from "@/lib/ai/cv-parser";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type FeedbackCardsProps = {
  analysis: CVAnalysis;
};

function getScoreColor(score: number): string {
  if (score >= 90) {
    return "text-green-600 dark:text-green-400";
  }
  if (score >= 70) {
    return "text-emerald-600 dark:text-emerald-400";
  }
  if (score >= 50) {
    return "text-yellow-600 dark:text-yellow-400";
  }
  return "text-red-600 dark:text-red-400";
}

function getScoreProgressColor(score: number): string {
  if (score >= 90) {
    return "bg-green-500";
  }
  if (score >= 70) {
    return "bg-emerald-500";
  }
  if (score >= 50) {
    return "bg-yellow-500";
  }
  return "bg-red-500";
}

function getScoreLabel(score: number, t: (key: string) => string): string {
  if (score >= 90) {
    return t("CV_REVIEW_SCORE_EXCELLENT");
  }
  if (score >= 70) {
    return t("CV_REVIEW_SCORE_GOOD");
  }
  if (score >= 50) {
    return t("CV_REVIEW_SCORE_AVERAGE");
  }
  return t("CV_REVIEW_SCORE_NEEDS_WORK");
}

export function ScoreCard({ score }: { score: number }) {
  const { t } = useTranslation();
  const scoreColor = getScoreColor(score);
  const progressColor = getScoreProgressColor(score);
  const label = getScoreLabel(score, t);

  return (
    <Card className="border-2">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <SparklesIcon className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-lg">{t("CV_REVIEW_SCORE")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <span className={cn("font-bold text-5xl tabular-nums", scoreColor)}>
            {score}
          </span>
          <span className="text-2xl text-muted-foreground">/100</span>
        </div>
        <Progress value={score}>
          <ProgressLabel className="sr-only">
            {t("CV_REVIEW_SCORE")}
          </ProgressLabel>
          <ProgressValue
            className={cn("font-medium", scoreColor)}
            render={() => label}
          />
        </Progress>
        <style>{`
          [data-slot="progress-indicator"] {
            background-color: var(--progress-color);
          }
        `}</style>
        <div
          style={
            {
              "--progress-color": `var(--color-${progressColor.replace("bg-", "")})`,
            } as React.CSSProperties
          }
        />
      </CardContent>
    </Card>
  );
}

export function StrengthsCard({ strengths }: { strengths: string[] }) {
  const { t } = useTranslation();

  if (strengths.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
            <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <CardTitle className="text-lg">
              {t("CV_REVIEW_STRENGTHS")}
            </CardTitle>
            <CardDescription>{t("CV_REVIEW_STRENGTHS_DESC")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {strengths.map((strength) => (
            <li className="flex items-start gap-3" key={strength}>
              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
              <span className="text-sm">{strength}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function ImprovementsCard({ improvements }: { improvements: string[] }) {
  const { t } = useTranslation();

  if (improvements.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
            <LightbulbIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <CardTitle className="text-lg">
              {t("CV_REVIEW_IMPROVEMENTS")}
            </CardTitle>
            <CardDescription>
              {t("CV_REVIEW_IMPROVEMENTS_DESC")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {improvements.map((improvement) => (
            <li className="flex items-start gap-3" key={improvement}>
              <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm">{improvement}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function MissingElementsCard({
  missingElements,
}: {
  missingElements: string[];
}) {
  const { t } = useTranslation();

  if (missingElements.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
            <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <CardTitle className="text-lg">{t("CV_REVIEW_MISSING")}</CardTitle>
            <CardDescription>{t("CV_REVIEW_MISSING_DESC")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {missingElements.map((element) => (
            <li className="flex items-start gap-3" key={element}>
              <XCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              <span className="text-sm">{element}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function SkillsCard({ skills }: { skills: string[] }) {
  const { t } = useTranslation();

  if (skills.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <BookOpenIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{t("CV_REVIEW_SKILLS")}</CardTitle>
            <CardDescription>{t("CV_REVIEW_SKILLS_DESC")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <Badge key={skill} variant="secondary">
              {skill}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ExperienceEducationCard({
  experienceYears,
  educationLevel,
}: {
  experienceYears: number | null;
  educationLevel: string | null;
}) {
  const { t } = useTranslation();

  if (experienceYears === null && educationLevel === null) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("CV_REVIEW_PROFILE")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {experienceYears !== null && (
            <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <BriefcaseIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {t("CV_REVIEW_EXPERIENCE")}
                </p>
                <p className="text-muted-foreground text-sm">
                  {experienceYears === 1
                    ? t("CV_REVIEW_YEARS_SINGULAR", { count: experienceYears })
                    : t("CV_REVIEW_YEARS_PLURAL", { count: experienceYears })}
                </p>
              </div>
            </div>
          )}
          {educationLevel !== null && (
            <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <GraduationCapIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {t("CV_REVIEW_EDUCATION")}
                </p>
                <p className="text-muted-foreground text-sm">
                  {educationLevel}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function FeedbackCards({ analysis }: FeedbackCardsProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ScoreCard score={analysis.overallScore} />
        <div className="md:col-span-1 lg:col-span-2">
          <ExperienceEducationCard
            experienceYears={analysis.experienceYears}
            educationLevel={analysis.educationLevel}
          />
        </div>
      </div>

      <SkillsCard skills={analysis.extractedSkills} />

      <div className="grid gap-6 lg:grid-cols-2">
        <StrengthsCard strengths={analysis.strengths} />
        <ImprovementsCard improvements={analysis.improvements} />
      </div>

      <MissingElementsCard missingElements={analysis.missingElements} />
    </div>
  );
}
