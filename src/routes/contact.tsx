import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  Building2Icon,
  CalendarIcon,
  CheckCircleIcon,
  MailIcon,
  MessageSquareIcon,
  PhoneIcon,
  UserIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { PublicLayout } from "@/components/public/public-layout";
import { Button } from "@/components/ui/button";
import { DEFAULT_SITE_NAME, seo } from "@/utils/seo";

export const Route = createFileRoute("/contact")({
  head: () => {
    const { meta, links } = seo({
      title: `Contact Us - ${DEFAULT_SITE_NAME}`,
      description:
        "Get in touch with our recruitment team. We're here to help you find the perfect talent or your next career opportunity.",
      url: "/contact",
      canonicalUrl: "/contact",
    });
    return { meta, links };
  },
  component: ContactPage,
});

type InquiryType = "hiring" | "job" | "partnership" | "other";

function ContactPage() {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    inquiryType: "hiring" as InquiryType,
    message: "",
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission - replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isSubmitted) {
    return (
      <PublicLayout>
        <section className="bg-ocean-5 py-32">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-white p-12 shadow-xl">
              <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircleIcon
                  className="size-8 text-green-600"
                  aria-hidden="true"
                />
              </div>
              <h1 className="mb-4 font-display text-3xl font-bold text-depth-1">
                {t("CONTACT_SUCCESS_TITLE")}
              </h1>
              <p className="mb-8 text-slate-600">{t("CONTACT_SUCCESS_DESC")}</p>
              <Link to="/">
                <Button
                  type="button"
                  className="bg-ocean-1 hover:bg-ocean-2"
                  variant="default"
                >
                  <ArrowLeftIcon className="mr-2 size-4" aria-hidden="true" />
                  {t("CONTACT_BACK_HOME")}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-ocean-4 pt-24 pb-12">
        {/* Subtle Grid Background */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-10">
          <svg
            width="100%"
            height="100%"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <title>Background Grid</title>
            <defs>
              <pattern
                id="contact-page-grid"
                width="80"
                height="80"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 80 0 L 0 0 0 80"
                  fill="none"
                  stroke="white"
                  strokeOpacity="0.3"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect fill="url(#contact-page-grid)" width="100%" height="100%" />
          </svg>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link to="/" className="mb-6 inline-block">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-white/80 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeftIcon className="mr-2 size-4" aria-hidden="true" />
              {t("CONTACT_BACK_HOME")}
            </Button>
          </Link>

          {/* Page Title */}
          <h1 className="font-display text-3xl font-bold text-white md:text-4xl">
            {t("CONTACT_TITLE")}
          </h1>
          <p className="mt-2 text-lg text-white/80">{t("CONTACT_SUBTITLE")}</p>
        </div>
      </section>

      {/* Form Section */}
      <section className="bg-background-light py-12 dark:bg-background">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl border border-slate-100 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                <UserIcon className="size-4" aria-hidden="true" />
                {t("CONTACT_FORM_NAME")}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder={t("CONTACT_FORM_NAME_PLACEHOLDER")}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-ocean-1 focus:ring-2 focus:ring-ocean-1/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                <MailIcon className="size-4" aria-hidden="true" />
                {t("CONTACT_FORM_EMAIL")}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder={t("CONTACT_FORM_EMAIL_PLACEHOLDER")}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-ocean-1 focus:ring-2 focus:ring-ocean-1/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Company Field */}
            <div>
              <label
                htmlFor="company"
                className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                <Building2Icon className="size-4" aria-hidden="true" />
                {t("CONTACT_FORM_COMPANY")}
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder={t("CONTACT_FORM_COMPANY_PLACEHOLDER")}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-ocean-1 focus:ring-2 focus:ring-ocean-1/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Phone Field */}
            <div>
              <label
                htmlFor="phone"
                className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                <PhoneIcon className="size-4" aria-hidden="true" />
                {t("CONTACT_FORM_PHONE")}
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t("CONTACT_FORM_PHONE_PLACEHOLDER")}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-ocean-1 focus:ring-2 focus:ring-ocean-1/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Inquiry Type Field */}
            <div>
              <label
                htmlFor="inquiryType"
                className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                <MessageSquareIcon className="size-4" aria-hidden="true" />
                {t("CONTACT_FORM_INQUIRY_TYPE")}
              </label>
              <select
                id="inquiryType"
                name="inquiryType"
                value={formData.inquiryType}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 focus:border-ocean-1 focus:ring-2 focus:ring-ocean-1/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="hiring">
                  {t("CONTACT_FORM_INQUIRY_HIRING")}
                </option>
                <option value="job">{t("CONTACT_FORM_INQUIRY_JOB")}</option>
                <option value="partnership">
                  {t("CONTACT_FORM_INQUIRY_PARTNERSHIP")}
                </option>
                <option value="other">{t("CONTACT_FORM_INQUIRY_OTHER")}</option>
              </select>
            </div>

            {/* Message Field */}
            <div>
              <label
                htmlFor="message"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                {t("CONTACT_FORM_MESSAGE")}
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                value={formData.message}
                onChange={handleChange}
                placeholder={t("CONTACT_FORM_MESSAGE_PLACEHOLDER")}
                className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-ocean-1 focus:ring-2 focus:ring-ocean-1/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-ocean-1 py-3 text-lg font-semibold hover:bg-ocean-2"
            >
              {isSubmitting
                ? t("CONTACT_FORM_SUBMITTING")
                : t("CONTACT_FORM_SUBMIT")}
            </Button>

            {/* Calendar Booking Alternative */}
            <div className="border-t border-slate-100 pt-6 text-center dark:border-slate-800">
              <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
                {t("CONTACT_CALENDAR_NOTE")}
              </p>
              <a
                href="#"
                className="inline-flex items-center gap-2 text-ocean-1 transition hover:text-ocean-2 hover:underline"
                rel="noopener noreferrer"
              >
                <CalendarIcon className="size-4" aria-hidden="true" />
                {t("CONTACT_CALENDAR_LINK")}
              </a>
            </div>
          </form>
        </div>
      </section>
    </PublicLayout>
  );
}
