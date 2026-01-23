import { createFileRoute } from "@tanstack/react-router";
import {
  FileTextIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { CVAnalysis } from "@/lib/ai/cv-parser";

import { PublicLayout } from "@/components/public/public-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { FeedbackCards } from "@/features/cv-review/feedback-cards";
import { DEFAULT_SITE_NAME, seo } from "@/utils/seo";

export const Route = createFileRoute("/cv-review")({
  head: () => {
    const title = `Free CV Review - ${DEFAULT_SITE_NAME}`;
    const description =
      "Get instant AI-powered feedback on your CV. Upload your resume and receive actionable insights to improve your job applications.";

    const { meta, links } = seo({
      title,
      description,
      keywords:
        "CV review, resume feedback, AI CV analysis, career advice, job application tips",
      url: "/cv-review",
      canonicalUrl: "/cv-review",
    });

    return { meta, links };
  },
  component: CVReviewPage,
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function CVReviewPage() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CVAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.item(0);
    if (!selectedFile) {
      return;
    }

    setFileError(null);
    setAnalysisError(null);

    if (!ACCEPTED_FILE_TYPES.includes(selectedFile.type)) {
      setFileError(t("APPLICATION_CV_FORMAT_ERROR"));
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFileError(t("APPLICATION_CV_SIZE_ERROR"));
      return;
    }

    setFile(selectedFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileError(null);
  };

  const handleReset = () => {
    setFile(null);
    setFileError(null);
    setAnalysisResult(null);
    setAnalysisError(null);
  };

  const handleAnalyze = async () => {
    if (!file) {
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ai/cv-review", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("COMMON_UNKNOWN_ERROR"));
      }

      setAnalysisResult(data as CVAnalysis);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("COMMON_UNKNOWN_ERROR");
      setAnalysisError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative bg-ocean-4 py-16 text-white md:py-20">
        {/* Animated grid background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <svg
            className="absolute inset-0 h-full w-full opacity-10"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="cv-grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cv-grid)" />
          </svg>
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
            <SparklesIcon className="h-4 w-4" />
            {t("CV_REVIEW_BADGE")}
          </div>
          <h1 className="mt-6 font-bold text-4xl leading-tight md:text-5xl lg:text-6xl">
            {t("CV_REVIEW_TITLE")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80 md:text-xl">
            {t("CV_REVIEW_DESC")}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 md:py-16">
        {/* Results View */}
        {analysisResult ? (
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <h2 className="font-semibold text-2xl">
                {t("CV_REVIEW_RESULTS")}
              </h2>
              <Button
                onClick={handleReset}
                type="button"
                variant="outline"
                className="gap-2 border-ocean-1 text-ocean-1 hover:bg-ocean-1/10"
              >
                <RefreshCwIcon className="h-4 w-4" />
                {t("CV_REVIEW_TRY_ANOTHER")}
              </Button>
            </div>

            <FeedbackCards analysis={analysisResult} />

            {/* Privacy note */}
            <Alert className="mt-8 border-ocean-1/30 bg-ocean-1/5">
              <ShieldCheckIcon className="h-4 w-4 text-ocean-1" />
              <AlertTitle>{t("CV_REVIEW_PRIVACY_TITLE")}</AlertTitle>
              <AlertDescription>{t("CV_REVIEW_PRIVACY_DESC")}</AlertDescription>
            </Alert>
          </div>
        ) : (
          /* Upload View */
          <div className="mx-auto max-w-xl">
            <Card className="overflow-hidden border-l-4 border-l-ocean-1 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-ocean-1/5 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5 text-ocean-1" />
                  {t("CV_REVIEW_UPLOAD")}
                </CardTitle>
                <CardDescription>{t("APPLICATION_CV_FORMATS")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* File Upload Area */}
                {file ? (
                  <div className="flex items-center justify-between rounded-lg border border-ocean-1/30 bg-ocean-1/5 p-4">
                    <div className="flex items-center gap-3">
                      <FileTextIcon className="h-8 w-8 text-ocean-1" />
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      aria-label={t("REMOVE")}
                      disabled={isAnalyzing}
                      onClick={handleRemoveFile}
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      aria-describedby={fileError ? "file-error" : undefined}
                      className="hidden"
                      id="cv-file"
                      onChange={handleFileChange}
                      type="file"
                    />
                    <label
                      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-ocean-1/40 p-12 transition-colors hover:border-ocean-1 hover:bg-ocean-1/5"
                      htmlFor="cv-file"
                    >
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ocean-1/10">
                        <UploadIcon className="h-8 w-8 text-ocean-1" />
                      </div>
                      <span className="mb-1 font-medium text-sm">
                        {t("CV_REVIEW_UPLOAD_ACTION")}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {t("APPLICATION_CV_FORMATS")}
                      </span>
                    </label>
                  </div>
                )}

                {/* Error Message */}
                {fileError ? (
                  <p className="text-destructive text-sm" id="file-error">
                    {fileError}
                  </p>
                ) : null}

                {analysisError ? (
                  <Alert variant="destructive">
                    <AlertTitle>{t("ERROR_SOMETHING_WRONG")}</AlertTitle>
                    <AlertDescription>{analysisError}</AlertDescription>
                  </Alert>
                ) : null}

                {/* Analyze Button */}
                <Button
                  className="w-full bg-ocean-1 hover:bg-ocean-2"
                  disabled={!file || isAnalyzing}
                  onClick={handleAnalyze}
                  size="lg"
                  type="button"
                >
                  {isAnalyzing ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      {t("CV_REVIEW_ANALYZING")}
                    </>
                  ) : (
                    <>
                      <FileTextIcon className="mr-2 h-4 w-4" />
                      {t("CV_REVIEW_ANALYZE_BUTTON")}
                    </>
                  )}
                </Button>

                {/* Privacy note */}
                <div className="flex items-start gap-3 rounded-lg bg-ocean-1/5 p-4">
                  <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-ocean-1" />
                  <div>
                    <p className="font-medium text-sm">
                      {t("CV_REVIEW_PRIVACY_TITLE")}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {t("CV_REVIEW_PRIVACY_DESC")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </PublicLayout>
  );
}
