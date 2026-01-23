import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CheckCircleIcon, UploadIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { orpc } from "@/orpc/orpc-client";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

type FormErrors = {
  fullName?: string;
  email?: string;
  cv?: string;
};

type ApplicationFormProps = {
  jobSlug: string;
  jobTitle: string;
};

export function ApplicationForm({ jobSlug, jobTitle }: ApplicationFormProps) {
  const { t } = useTranslation();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const createApplicationMutation = useMutation({
    ...orpc.applications.create.mutationOptions(),
    onSuccess: () => {
      setIsSubmitted(true);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      newErrors.fullName = t("APPLICATION_NAME_ERROR");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      newErrors.email = t("APPLICATION_EMAIL_ERROR");
    }

    if (!cvFile) {
      newErrors.cv = t("APPLICATION_CV_REQUIRED");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.item(0);
    if (!file) {
      return;
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, cv: t("APPLICATION_CV_FORMAT_ERROR") }));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({ ...prev, cv: t("APPLICATION_CV_SIZE_ERROR") }));
      return;
    }

    setCvFile(file);
    setErrors((prev) => ({ ...prev, cv: undefined }));
  };

  const handleRemoveFile = () => {
    setCvFile(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip the data:...;base64, prefix
        const base64 = result.split(",").at(1) ?? "";
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm() || !cvFile) {
      return;
    }

    const cvFileData = await fileToBase64(cvFile);

    createApplicationMutation.mutate({
      jobSlug,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      message: message.trim() || undefined,
      cvFileName: cvFile.name,
      cvFileType: cvFile.type,
      cvFileData,
    });
  };

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <CheckCircleIcon className="mb-4 size-16 text-green-500" />
          <h2 className="mb-2 text-2xl font-bold">
            {t("APPLICATION_SUCCESS_TITLE")}
          </h2>
          <p className="mb-6 text-muted-foreground">
            {t("APPLICATION_SUCCESS_DESC")}
          </p>
          <Link to="/jobs">
            <Button type="button" variant="outline">
              {t("APPLICATION_BACK_TO_JOBS")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("APPLICATION_TITLE")}</CardTitle>
        <CardDescription>
          {t("APPLICATION_SUBTITLE")} - {jobTitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">{t("APPLICATION_NAME")} *</Label>
            <Input
              id="fullName"
              type="text"
              placeholder={t("APPLICATION_NAME_PLACEHOLDER")}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
            />
            {errors.fullName ? (
              <p id="fullName-error" className="text-sm text-destructive">
                {errors.fullName}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("APPLICATION_EMAIL")} *</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("APPLICATION_EMAIL_PLACEHOLDER")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email ? (
              <p id="email-error" className="text-sm text-destructive">
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t("APPLICATION_PHONE")}</Label>
            <Input
              id="phone"
              type="tel"
              placeholder={t("APPLICATION_PHONE_PLACEHOLDER")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t("APPLICATION_MESSAGE")}</Label>
            <Textarea
              id="message"
              placeholder={t("APPLICATION_MESSAGE_PLACEHOLDER")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cv">{t("APPLICATION_CV_UPLOAD")} *</Label>
            <div className="space-y-2">
              {cvFile ? (
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                  <span className="truncate text-sm">{cvFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleRemoveFile}
                    aria-label={t("REMOVE")}
                  >
                    <XIcon className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    id="cv"
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="hidden"
                    aria-describedby="cv-formats cv-error"
                  />
                  <label
                    htmlFor="cv"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary/50 hover:bg-muted/30"
                  >
                    <UploadIcon className="mb-2 size-8 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {t("APPLICATION_CV_UPLOAD")}
                    </span>
                    <span
                      id="cv-formats"
                      className="mt-1 text-xs text-muted-foreground"
                    >
                      {t("APPLICATION_CV_FORMATS")}
                    </span>
                  </label>
                </div>
              )}
              {errors.cv ? (
                <p id="cv-error" className="text-sm text-destructive">
                  {errors.cv}
                </p>
              ) : null}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={createApplicationMutation.isPending}
          >
            {createApplicationMutation.isPending
              ? t("APPLICATION_SUBMITTING")
              : t("APPLICATION_SUBMIT")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
