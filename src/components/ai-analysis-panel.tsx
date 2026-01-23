import {
  AlertTriangleIcon,
  CheckCircleIcon,
  HelpCircleIcon,
  XCircleIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type { CVAnalysis } from "@/lib/db/schema/recruiting";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AIScoreBadge } from "./ai-score-badge";

type AIAnalysisPanelProps = {
  analysis: CVAnalysis | null | undefined;
};

function AIAnalysisPanel({ analysis }: AIAnalysisPanelProps) {
  const { t } = useTranslation();

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("ADMIN_APPLICATION_ANALYSIS")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No AI analysis available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t("ADMIN_APPLICATION_ANALYSIS")}</span>
          <AIScoreBadge score={analysis.fitScore} size="lg" showLabel />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Matched Skills */}
        {analysis.matchedSkills && analysis.matchedSkills.length > 0 ? (
          <div>
            <h4 className="mb-2 flex items-center gap-2 font-medium text-sm">
              <CheckCircleIcon className="size-4 text-green-600" />
              {t("ADMIN_APPLICATION_SKILLS")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.matchedSkills.map((skill) => (
                <Badge
                  key={skill}
                  className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {/* Missing Skills */}
        {analysis.missingSkills && analysis.missingSkills.length > 0 ? (
          <div>
            <h4 className="mb-2 flex items-center gap-2 font-medium text-sm">
              <XCircleIcon className="size-4 text-red-600" />
              {t("ADMIN_APPLICATION_GAPS")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.missingSkills.map((skill) => (
                <Badge
                  key={skill}
                  className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {/* Red Flags */}
        {analysis.redFlags && analysis.redFlags.length > 0 ? (
          <div>
            <h4 className="mb-2 flex items-center gap-2 font-medium text-sm">
              <AlertTriangleIcon className="size-4 text-amber-600" />
              {t("ADMIN_APPLICATION_RED_FLAGS")}
            </h4>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground text-sm">
              {analysis.redFlags.map((flag, index) => (
                <li key={index}>{flag}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Interview Questions */}
        {analysis.interviewQuestions &&
        analysis.interviewQuestions.length > 0 ? (
          <div>
            <h4 className="mb-2 flex items-center gap-2 font-medium text-sm">
              <HelpCircleIcon className="size-4 text-blue-600" />
              {t("ADMIN_APPLICATION_QUESTIONS")}
            </h4>
            <ol className="list-inside list-decimal space-y-2 text-muted-foreground text-sm">
              {analysis.interviewQuestions.map((question, index) => (
                <li key={index}>{question}</li>
              ))}
            </ol>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export { AIAnalysisPanel };
export type { AIAnalysisPanelProps };
