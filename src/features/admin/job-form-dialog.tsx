"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BriefcaseIcon } from "lucide-react";
import { useEffect } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  type EmploymentType,
  EMPLOYMENT_TYPES,
  INDUSTRIES,
  type Industry,
  type Location,
  LOCATIONS,
} from "@/lib/constants/recruiting";

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

function getLocationKey(location: Location): LocationKey {
  return `LOCATION_${location.toUpperCase()}` as LocationKey;
}

function getEmploymentTypeKey(type: EmploymentType): EmploymentTypeKey {
  return `EMPLOYMENT_TYPE_${type.toUpperCase().replace("-", "_")}` as EmploymentTypeKey;
}

function getIndustryKey(industry: Industry): IndustryKey {
  return `INDUSTRY_${industry.toUpperCase()}` as IndustryKey;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const jobFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
  employmentType: z.string().min(1, "Employment type is required"),
  industry: z.string().min(1, "Industry is required"),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  isActive: z.boolean().default(true),
  autoSlug: z.boolean().default(true),
});

type JobFormData = z.infer<typeof jobFormSchema>;

type Job = {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  employmentType: string;
  industry: string;
  salaryMin: number | null;
  salaryMax: number | null;
  requirements: string | null;
  benefits: string | null;
  isActive: boolean;
};

type JobFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: Job | null;
  onSubmit: (data: Omit<JobFormData, "autoSlug">) => void;
  isPending?: boolean;
};

function JobFormDialog({
  open,
  onOpenChange,
  job,
  onSubmit,
  isPending = false,
}: JobFormDialogProps) {
  const { t } = useTranslation();
  const isEditing = Boolean(job);

  const form = useForm({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      location: "",
      employmentType: "",
      industry: "",
      salaryMin: undefined as number | undefined,
      salaryMax: undefined as number | undefined,
      requirements: "",
      benefits: "",
      isActive: true,
      autoSlug: true,
    },
  });

  const watchTitle = form.watch("title");
  const watchAutoSlug = form.watch("autoSlug");

  // Auto-generate slug from title
  useEffect(() => {
    if (watchAutoSlug && watchTitle && !isEditing) {
      form.setValue("slug", slugify(watchTitle));
    }
  }, [watchTitle, watchAutoSlug, isEditing, form]);

  // Reset form when job changes or dialog opens
  useEffect(() => {
    if (open) {
      if (job) {
        form.reset({
          title: job.title,
          slug: job.slug,
          description: job.description,
          location: job.location,
          employmentType: job.employmentType,
          industry: job.industry,
          salaryMin: job.salaryMin ?? undefined,
          salaryMax: job.salaryMax ?? undefined,
          requirements: job.requirements ?? "",
          benefits: job.benefits ?? "",
          isActive: job.isActive,
          autoSlug: false,
        });
      } else {
        form.reset({
          title: "",
          slug: "",
          description: "",
          location: "",
          employmentType: "",
          industry: "",
          salaryMin: undefined,
          salaryMax: undefined,
          requirements: "",
          benefits: "",
          isActive: true,
          autoSlug: true,
        });
      }
    }
  }, [open, job, form]);

  const handleSubmit = (data: z.infer<typeof jobFormSchema>) => {
    const { autoSlug: _, ...submitData } = data;
    onSubmit(submitData);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BriefcaseIcon className="size-5" />
            {isEditing ? t("ADMIN_JOBS_EDIT") : t("ADMIN_JOBS_CREATE")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the job listing details."
              : "Create a new job listing."}
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <Controller
              control={form.control}
              name="title"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="jobTitle">
                    {t("ADMIN_JOBS_FORM_TITLE")}
                  </FieldLabel>
                  <Input
                    aria-invalid={fieldState.invalid}
                    id="jobTitle"
                    placeholder={t("ADMIN_JOBS_FORM_TITLE_PLACEHOLDER")}
                    {...field}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <div className="space-y-2">
              <Controller
                control={form.control}
                name="slug"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="jobSlug">
                      {t("ADMIN_JOBS_FORM_SLUG")}
                    </FieldLabel>
                    <Input
                      aria-invalid={fieldState.invalid}
                      disabled={watchAutoSlug && !isEditing}
                      id="jobSlug"
                      placeholder={t("ADMIN_JOBS_FORM_SLUG_PLACEHOLDER")}
                      {...field}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              {!isEditing ? (
                <Controller
                  control={form.control}
                  name="autoSlug"
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={field.value}
                        id="autoSlug"
                        onCheckedChange={field.onChange}
                      />
                      <label
                        className="cursor-pointer text-muted-foreground text-sm"
                        htmlFor="autoSlug"
                      >
                        {t("ADMIN_JOBS_FORM_SLUG_AUTO")}
                      </label>
                    </div>
                  )}
                />
              ) : null}
            </div>

            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="jobDescription">
                    {t("ADMIN_JOBS_FORM_DESCRIPTION")}
                  </FieldLabel>
                  <Textarea
                    aria-invalid={fieldState.invalid}
                    className="min-h-[100px]"
                    id="jobDescription"
                    placeholder={t("ADMIN_JOBS_FORM_DESCRIPTION_PLACEHOLDER")}
                    {...field}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <Controller
                control={form.control}
                name="location"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>{t("ADMIN_JOBS_FORM_LOCATION")}</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("ADMIN_JOBS_FORM_LOCATION")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATIONS.map((loc) => (
                          <SelectItem key={loc} value={loc}>
                            {t(getLocationKey(loc))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="employmentType"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      {t("ADMIN_JOBS_FORM_EMPLOYMENT_TYPE")}
                    </FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("ADMIN_JOBS_FORM_EMPLOYMENT_TYPE")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {EMPLOYMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(getEmploymentTypeKey(type))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="industry"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>{t("ADMIN_JOBS_FORM_INDUSTRY")}</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("ADMIN_JOBS_FORM_INDUSTRY")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((ind) => (
                          <SelectItem key={ind} value={ind}>
                            {t(getIndustryKey(ind))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="salaryMin"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="salaryMin">
                      {t("ADMIN_JOBS_FORM_SALARY_MIN")}
                    </FieldLabel>
                    <Input
                      aria-invalid={fieldState.invalid}
                      id="salaryMin"
                      placeholder="50000"
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? Number.parseInt(e.target.value, 10)
                            : undefined
                        )
                      }
                      value={field.value ?? ""}
                    />
                    <FieldDescription>Optional</FieldDescription>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="salaryMax"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="salaryMax">
                      {t("ADMIN_JOBS_FORM_SALARY_MAX")}
                    </FieldLabel>
                    <Input
                      aria-invalid={fieldState.invalid}
                      id="salaryMax"
                      placeholder="80000"
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? Number.parseInt(e.target.value, 10)
                            : undefined
                        )
                      }
                      value={field.value ?? ""}
                    />
                    <FieldDescription>Optional</FieldDescription>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>

            <Controller
              control={form.control}
              name="requirements"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="requirements">
                    {t("ADMIN_JOBS_FORM_REQUIREMENTS")}
                  </FieldLabel>
                  <Textarea
                    aria-invalid={fieldState.invalid}
                    className="min-h-[80px]"
                    id="requirements"
                    placeholder={t("ADMIN_JOBS_FORM_REQUIREMENTS_PLACEHOLDER")}
                    {...field}
                  />
                  <FieldDescription>Optional</FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="benefits"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="benefits">
                    {t("ADMIN_JOBS_FORM_BENEFITS")}
                  </FieldLabel>
                  <Textarea
                    aria-invalid={fieldState.invalid}
                    className="min-h-[80px]"
                    id="benefits"
                    placeholder={t("ADMIN_JOBS_FORM_BENEFITS_PLACEHOLDER")}
                    {...field}
                  />
                  <FieldDescription>Optional</FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={field.value}
                    id="isActive"
                    onCheckedChange={field.onChange}
                  />
                  <label
                    className="cursor-pointer font-medium text-sm"
                    htmlFor="isActive"
                  >
                    {t("ADMIN_JOBS_FORM_IS_ACTIVE")}
                  </label>
                </div>
              )}
            />

            <DialogFooter>
              <ButtonGroup>
                <Button
                  onClick={() => onOpenChange(false)}
                  type="button"
                  variant="outline"
                >
                  {t("CANCEL")}
                </Button>
                <Button disabled={isPending} type="submit">
                  {isPending ? (
                    <>
                      <Spinner className="mr-2" />
                      {t("ADMIN_JOBS_FORM_SAVING")}
                    </>
                  ) : (
                    t("ADMIN_JOBS_FORM_SAVE")
                  )}
                </Button>
              </ButtonGroup>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

export { JobFormDialog };
export type { JobFormDialogProps, Job, JobFormData };
