# ZaikaConnect Recruiting Platform Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a recruiting platform with public job board, guest applications, AI-powered CV analysis, and admin dashboard.

**Architecture:** Public routes for job browsing and applications (no auth). Admin routes protected by email whitelist in env. AI analysis via Vercel AI SDK with file upload to OpenAI. Existing storage system for CV files.

**Tech Stack:** TanStack Start, Drizzle ORM, oRPC, Vercel AI SDK (@ai-sdk/openai), shadcn + Base UI, i18next, Resend for emails.

---

## Phase 0: Landing Page

### Task 0: Create Recruiting Landing Page

**Files:**

- Rewrite: `src/routes/index.tsx`

**Step 1: Replace landing page with recruiting-focused content**

The landing page needs these sections:

- Hero: "Find Your Next Opportunity" + CTA to browse jobs
- Value props for candidates (easy apply, AI CV review, etc.)
- Value props for companies (quality candidates, AI screening)
- Featured jobs section (pulls from DB)
- CV Review tool promo
- How it works (3 steps)
- Testimonials placeholder
- CTA section

```typescript
// src/routes/index.tsx
import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BriefcaseIcon,
  CheckCircle2,
  FileTextIcon,
  SearchIcon,
  SparklesIcon,
  UsersIcon,
  ZapIcon,
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
import { Logo } from "@/components/ui/logo";
import { Section } from "@/features/landing/landing-section";
import { JobCard } from "@/features/jobs/job-card";
import { orpc } from "@/orpc/orpc-client";
import { DEFAULT_SITE_NAME, seo } from "@/utils/seo";

export const Route = createFileRoute("/")({
  head: () => {
    const title = `${DEFAULT_SITE_NAME} - Find Your Next Opportunity`;
    const description =
      "Connect with top companies and find your dream job. AI-powered CV review, easy applications, and personalized job matching.";

    const { meta, links } = seo({
      title,
      description,
      keywords: "jobs, recruiting, careers, CV review, job search, hiring",
      url: "/",
    });

    return { meta, links };
  },
  component: LandingPage,
});

function LandingPage() {
  const { t } = useTranslation();

  // Fetch featured jobs
  const { data: jobsData } = orpc.jobs.list.useQuery({
    input: { limit: 3 },
  });

  const candidateFeatures = [
    {
      icon: SearchIcon,
      title: t("LANDING_CANDIDATE_FEATURE_1_TITLE"),
      description: t("LANDING_CANDIDATE_FEATURE_1_DESC"),
    },
    {
      icon: SparklesIcon,
      title: t("LANDING_CANDIDATE_FEATURE_2_TITLE"),
      description: t("LANDING_CANDIDATE_FEATURE_2_DESC"),
    },
    {
      icon: ZapIcon,
      title: t("LANDING_CANDIDATE_FEATURE_3_TITLE"),
      description: t("LANDING_CANDIDATE_FEATURE_3_DESC"),
    },
  ];

  const companyFeatures = [
    {
      icon: UsersIcon,
      title: t("LANDING_COMPANY_FEATURE_1_TITLE"),
      description: t("LANDING_COMPANY_FEATURE_1_DESC"),
    },
    {
      icon: FileTextIcon,
      title: t("LANDING_COMPANY_FEATURE_2_TITLE"),
      description: t("LANDING_COMPANY_FEATURE_2_DESC"),
    },
    {
      icon: CheckCircle2,
      title: t("LANDING_COMPANY_FEATURE_3_TITLE"),
      description: t("LANDING_COMPANY_FEATURE_3_DESC"),
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 right-0 left-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link className="flex items-center space-x-2" to="/">
              <Logo className="h-10 w-10" />
              <span className="font-bold text-xl">ZaikaConnect</span>
            </Link>

            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link to="/jobs">{t("LANDING_NAV_JOBS")}</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/cv-review">{t("LANDING_NAV_CV_REVIEW")}</Link>
              </Button>
              <Button asChild>
                <Link to="/jobs">
                  {t("LANDING_NAV_FIND_JOB")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-48 md:pb-32">
        <div className="container relative mx-auto px-4 text-center">
          <Badge className="mb-8" variant="outline">
            {t("LANDING_HERO_BADGE")}
          </Badge>
          <h1 className="mb-8 font-black text-5xl tracking-tight md:text-7xl">
            {t("LANDING_HERO_TITLE")}
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-muted-foreground text-xl">
            {t("LANDING_HERO_SUBTITLE")}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" className="h-14 px-8 text-lg" asChild>
              <Link to="/jobs">
                {t("LANDING_CTA_BROWSE_JOBS")}
                <BriefcaseIcon className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg" asChild>
              <Link to="/cv-review">
                {t("LANDING_CTA_CV_REVIEW")}
                <SparklesIcon className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* For Candidates */}
      <Section variant="muted">
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-bold text-3xl">{t("LANDING_CANDIDATES_TITLE")}</h2>
          <p className="text-muted-foreground text-lg">{t("LANDING_CANDIDATES_SUBTITLE")}</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {candidateFeatures.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Featured Jobs */}
      {jobsData?.jobs && jobsData.jobs.length > 0 && (
        <Section>
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-bold text-3xl">{t("LANDING_FEATURED_JOBS_TITLE")}</h2>
            <p className="text-muted-foreground text-lg">{t("LANDING_FEATURED_JOBS_SUBTITLE")}</p>
          </div>
          <div className="grid gap-6">
            {jobsData.jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button size="lg" variant="outline" asChild>
              <Link to="/jobs">
                {t("LANDING_VIEW_ALL_JOBS")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Section>
      )}

      {/* CV Review Promo */}
      <Section variant="muted">
        <div className="mx-auto max-w-3xl text-center">
          <SparklesIcon className="mx-auto mb-6 h-12 w-12 text-primary" />
          <h2 className="mb-4 font-bold text-3xl">{t("LANDING_CV_REVIEW_TITLE")}</h2>
          <p className="mb-8 text-muted-foreground text-lg">
            {t("LANDING_CV_REVIEW_DESC")}
          </p>
          <Button size="lg" asChild>
            <Link to="/cv-review">
              {t("LANDING_CV_REVIEW_CTA")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Section>

      {/* For Companies */}
      <Section>
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-bold text-3xl">{t("LANDING_COMPANIES_TITLE")}</h2>
          <p className="text-muted-foreground text-lg">{t("LANDING_COMPANIES_SUBTITLE")}</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {companyFeatures.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button size="lg" variant="outline" asChild>
            <Link to="/contact">{t("LANDING_CONTACT_US")}</Link>
          </Button>
        </div>
      </Section>

      {/* How it Works */}
      <Section variant="muted">
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-bold text-3xl">{t("LANDING_HOW_IT_WORKS_TITLE")}</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 font-bold text-2xl text-primary">
              1
            </div>
            <h3 className="mb-2 font-bold text-xl">{t("LANDING_STEP_1_TITLE")}</h3>
            <p className="text-muted-foreground">{t("LANDING_STEP_1_DESC")}</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 font-bold text-2xl text-primary">
              2
            </div>
            <h3 className="mb-2 font-bold text-xl">{t("LANDING_STEP_2_TITLE")}</h3>
            <p className="text-muted-foreground">{t("LANDING_STEP_2_DESC")}</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 font-bold text-2xl text-primary">
              3
            </div>
            <h3 className="mb-2 font-bold text-xl">{t("LANDING_STEP_3_TITLE")}</h3>
            <p className="text-muted-foreground">{t("LANDING_STEP_3_DESC")}</p>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            © 2026 ZaikaConnect. {t("ALL_RIGHTS")}
          </p>
        </div>
      </footer>
    </div>
  );
}
```

**Step 2: Add landing page i18n keys to en.ts**

```typescript
// Landing page
LANDING_NAV_JOBS: "Jobs",
LANDING_NAV_CV_REVIEW: "CV Review",
LANDING_NAV_FIND_JOB: "Find a Job",
LANDING_HERO_BADGE: "AI-Powered Recruiting",
LANDING_HERO_TITLE: "Find Your Next Opportunity",
LANDING_HERO_SUBTITLE: "Connect with top companies and discover jobs that match your skills. Get instant AI feedback on your CV.",
LANDING_CTA_BROWSE_JOBS: "Browse Jobs",
LANDING_CTA_CV_REVIEW: "Free CV Review",

LANDING_CANDIDATES_TITLE: "For Job Seekers",
LANDING_CANDIDATES_SUBTITLE: "Everything you need to land your dream job",
LANDING_CANDIDATE_FEATURE_1_TITLE: "Smart Job Search",
LANDING_CANDIDATE_FEATURE_1_DESC: "Filter jobs by location, industry, and type. Find exactly what you're looking for.",
LANDING_CANDIDATE_FEATURE_2_TITLE: "AI CV Review",
LANDING_CANDIDATE_FEATURE_2_DESC: "Get instant feedback on your CV with our free AI-powered analysis tool.",
LANDING_CANDIDATE_FEATURE_3_TITLE: "Easy Applications",
LANDING_CANDIDATE_FEATURE_3_DESC: "Apply in minutes. No account required. Just upload your CV and go.",

LANDING_FEATURED_JOBS_TITLE: "Featured Positions",
LANDING_FEATURED_JOBS_SUBTITLE: "Explore our latest opportunities",
LANDING_VIEW_ALL_JOBS: "View All Jobs",

LANDING_CV_REVIEW_TITLE: "Free AI CV Review",
LANDING_CV_REVIEW_DESC: "Upload your CV and get instant, actionable feedback powered by AI. Improve your chances of landing interviews.",
LANDING_CV_REVIEW_CTA: "Try It Now",

LANDING_COMPANIES_TITLE: "For Employers",
LANDING_COMPANIES_SUBTITLE: "Find the best talent for your team",
LANDING_COMPANY_FEATURE_1_TITLE: "Quality Candidates",
LANDING_COMPANY_FEATURE_1_DESC: "Access pre-screened candidates who match your requirements.",
LANDING_COMPANY_FEATURE_2_TITLE: "AI Screening",
LANDING_COMPANY_FEATURE_2_DESC: "Our AI analyzes every application, scoring candidates against your job requirements.",
LANDING_COMPANY_FEATURE_3_TITLE: "Streamlined Process",
LANDING_COMPANY_FEATURE_3_DESC: "Manage applications, track candidates, and hire faster.",
LANDING_CONTACT_US: "Contact Us",

LANDING_HOW_IT_WORKS_TITLE: "How It Works",
LANDING_STEP_1_TITLE: "Browse Jobs",
LANDING_STEP_1_DESC: "Explore open positions filtered by your preferences.",
LANDING_STEP_2_TITLE: "Apply Online",
LANDING_STEP_2_DESC: "Submit your application with a single click. No account needed.",
LANDING_STEP_3_TITLE: "Get Hired",
LANDING_STEP_3_DESC: "Our team reviews your application and connects you with the right opportunity.",
```

**Step 3: Add German and Portuguese translations**

Add equivalent keys to `de.ts` and `pt.ts`.

---

## Phase 1: Database & Constants

### Task 1: Create Recruiting Constants

**Files:**

- Create: `src/lib/constants/recruiting.ts`

**Step 1: Create constants file**

```typescript
// src/lib/constants/recruiting.ts
export const EMPLOYMENT_TYPES = [
  "full-time",
  "part-time",
  "contract",
  "freelance",
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const INDUSTRIES = [
  "technology",
  "finance",
  "healthcare",
  "marketing",
  "sales",
  "engineering",
  "design",
  "operations",
] as const;

export type Industry = (typeof INDUSTRIES)[number];

export const LOCATIONS = [
  "remote",
  "berlin",
  "munich",
  "hamburg",
  "frankfurt",
  "hybrid",
] as const;

export type Location = (typeof LOCATIONS)[number];

export const APPLICATION_STATUSES = [
  "new",
  "reviewed",
  "shortlisted",
  "rejected",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
```

**Step 2: Verify file compiles**

Run: `bun run tsc`
Expected: No errors

---

### Task 2: Create Recruiting Database Schema

**Files:**

- Create: `src/lib/db/schema/recruiting.ts`
- Modify: `src/lib/db/schema/index.ts`

**Step 1: Create recruiting schema**

```typescript
// src/lib/db/schema/recruiting.ts
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  json,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { file } from "./storage";

// CV Analysis type for AI results
export type CVAnalysis = {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  missingElements: string[];
  extractedSkills: string[];
  experienceYears: number | null;
  educationLevel: string | null;
  fitScore: number | null;
  matchedSkills: string[] | null;
  missingSkills: string[] | null;
  redFlags: string[] | null;
  interviewQuestions: string[] | null;
};

export const jobs = pgTable("jobs", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements"),
  benefits: text("benefits"),
  location: text("location").notNull(),
  employmentType: text("employment_type").notNull(),
  industry: text("industry").notNull(),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const applications = pgTable("applications", {
  id: text("id").primaryKey(),
  jobId: text("job_id")
    .references(() => jobs.id, { onDelete: "cascade" })
    .notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message"),
  cvFileId: text("cv_file_id").references(() => file.id),
  cvFileKey: text("cv_file_key"),
  aiScore: integer("ai_score"),
  aiAnalysis: json("ai_analysis").$type<CVAnalysis>(),
  status: text("status").default("new").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobsRelations = relations(jobs, ({ many }) => ({
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
  cvFile: one(file, {
    fields: [applications.cvFileId],
    references: [file.id],
  }),
}));
```

**Step 2: Export from schema index**

Add to `src/lib/db/schema/index.ts`:

```typescript
export * from "./recruiting";
```

**Step 3: Generate migration**

Run: `bun run db:generate`
Expected: Migration file created in `src/lib/db/migrations/`

**Step 4: Push to database**

Run: `bun run db:push`
Expected: Tables created successfully

---

### Task 3: Create Admin Whitelist Check

**Files:**

- Create: `src/lib/auth/admin-check.ts`

**Step 1: Create admin check utility**

```typescript
// src/lib/auth/admin-check.ts
import { env } from "@/lib/env.server";

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;

  const whitelist =
    env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) ?? [];

  return whitelist.includes(email.toLowerCase());
}
```

**Step 2: Add env variable to schema**

Modify `src/lib/env.server.ts` - add to the env schema:

```typescript
ADMIN_EMAILS: z.string().optional(),
```

**Step 3: Add to .env.example**

```
ADMIN_EMAILS=admin@example.com,recruiter@example.com
```

---

### Task 4: Create Jobs Seed Script

**Files:**

- Create: `scripts/seed-jobs.ts`

**Step 1: Create seed script**

```typescript
// scripts/seed-jobs.ts
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";

const seedJobs = [
  {
    id: crypto.randomUUID(),
    slug: "senior-frontend-engineer",
    title: "Senior Frontend Engineer",
    description: `We're looking for a Senior Frontend Engineer to join our team and help build the next generation of our product.

You'll work closely with designers and backend engineers to create beautiful, performant user interfaces.

**What you'll do:**
- Build and maintain React components
- Optimize application performance
- Mentor junior developers
- Participate in code reviews`,
    requirements: `- 5+ years of frontend development experience
- Strong proficiency in React and TypeScript
- Experience with modern CSS (Tailwind, CSS-in-JS)
- Understanding of web performance optimization
- Excellent communication skills`,
    benefits: `- Competitive salary (€70,000 - €90,000)
- Remote-first culture
- 30 days vacation
- Learning budget
- Home office setup allowance`,
    location: "remote",
    employmentType: "full-time",
    industry: "technology",
    salaryMin: 70000,
    salaryMax: 90000,
    isActive: true,
  },
  {
    id: crypto.randomUUID(),
    slug: "product-designer",
    title: "Product Designer",
    description: `Join our design team to create intuitive and beautiful user experiences.

You'll own the design process from research to implementation, working with product managers and engineers.

**What you'll do:**
- Conduct user research and usability testing
- Create wireframes, prototypes, and high-fidelity designs
- Maintain and evolve our design system
- Collaborate with engineering on implementation`,
    requirements: `- 3+ years of product design experience
- Proficiency in Figma
- Experience with design systems
- Strong portfolio demonstrating UX process
- Ability to work in a fast-paced environment`,
    benefits: `- Competitive salary (€55,000 - €75,000)
- Flexible working hours
- Health insurance
- Team offsites
- Professional development budget`,
    location: "berlin",
    employmentType: "full-time",
    industry: "design",
    salaryMin: 55000,
    salaryMax: 75000,
    isActive: true,
  },
  {
    id: crypto.randomUUID(),
    slug: "backend-engineer-node",
    title: "Backend Engineer (Node.js)",
    description: `We're expanding our backend team and looking for engineers passionate about building scalable APIs.

You'll design and implement backend services that power our platform.

**What you'll do:**
- Design and build RESTful and GraphQL APIs
- Optimize database queries and architecture
- Implement security best practices
- Write comprehensive tests`,
    requirements: `- 3+ years of Node.js/TypeScript experience
- Experience with PostgreSQL or similar databases
- Understanding of API design principles
- Experience with cloud services (AWS/GCP)
- Knowledge of CI/CD pipelines`,
    benefits: `- Competitive salary (€60,000 - €80,000)
- Stock options
- Remote work options
- Conference attendance budget
- Gym membership`,
    location: "hybrid",
    employmentType: "full-time",
    industry: "technology",
    salaryMin: 60000,
    salaryMax: 80000,
    isActive: true,
  },
  {
    id: crypto.randomUUID(),
    slug: "marketing-manager",
    title: "Marketing Manager",
    description: `Lead our marketing efforts and help us reach more customers.

You'll develop and execute marketing strategies across multiple channels.

**What you'll do:**
- Develop marketing strategy and campaigns
- Manage social media presence
- Analyze marketing metrics and optimize
- Collaborate with sales team`,
    requirements: `- 4+ years of marketing experience
- Experience with B2B marketing
- Strong analytical skills
- Excellent written communication
- Experience with marketing automation tools`,
    benefits: `- Competitive salary (€50,000 - €65,000)
- Performance bonuses
- Flexible hours
- Remote-friendly
- Professional development`,
    location: "munich",
    employmentType: "full-time",
    industry: "marketing",
    salaryMin: 50000,
    salaryMax: 65000,
    isActive: true,
  },
  {
    id: crypto.randomUUID(),
    slug: "freelance-data-analyst",
    title: "Freelance Data Analyst",
    description: `We need a data analyst for a 3-month project to help us understand our user behavior.

**Project scope:**
- Analyze user engagement data
- Create dashboards and reports
- Provide actionable insights`,
    requirements: `- Experience with SQL and Python
- Proficiency in data visualization tools
- Strong analytical mindset
- Good communication skills`,
    benefits: `- Competitive hourly rate
- Flexible schedule
- Remote work
- Potential for extension`,
    location: "remote",
    employmentType: "freelance",
    industry: "technology",
    salaryMin: null,
    salaryMax: null,
    isActive: true,
  },
];

async function seed() {
  console.log("Seeding jobs...");

  for (const job of seedJobs) {
    await db.insert(jobs).values(job).onConflictDoNothing();
    console.log(`  Created: ${job.title}`);
  }

  console.log("Done!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
```

**Step 2: Add script to package.json**

Add to scripts section:

```json
"db:seed": "bun --env-file=.env run ./scripts/seed-jobs.ts"
```

**Step 3: Run seed**

Run: `bun run db:seed`
Expected: "Done!" with 5 jobs created

---

## Phase 2: i18n Keys

### Task 5: Add Recruiting i18n Keys

**Files:**

- Modify: `src/lib/intl/locales/en.ts`
- Modify: `src/lib/intl/locales/de.ts`
- Modify: `src/lib/intl/locales/pt.ts`

**Step 1: Add English keys**

Add to `src/lib/intl/locales/en.ts`:

```typescript
// Jobs
JOBS_TITLE: "Open Positions",
JOBS_SUBTITLE: "Find your next opportunity",
JOBS_EMPTY: "No jobs found matching your criteria.",
JOBS_LOADING: "Loading jobs...",
JOBS_FILTER_LOCATION: "Location",
JOBS_FILTER_TYPE: "Employment Type",
JOBS_FILTER_INDUSTRY: "Industry",
JOBS_FILTER_CLEAR: "Clear filters",
JOBS_FILTER_ALL: "All",
JOBS_CARD_LOCATION: "Location",
JOBS_CARD_TYPE: "Type",
JOBS_CARD_SALARY: "Salary",
JOBS_VIEW_DETAILS: "View Details",
JOBS_APPLY_NOW: "Apply Now",
JOBS_POSTED: "Posted",

// Job Detail
JOB_DETAIL_REQUIREMENTS: "Requirements",
JOB_DETAIL_BENEFITS: "Benefits",
JOB_DETAIL_ABOUT: "About this role",
JOB_DETAIL_BACK: "Back to jobs",
JOB_CHATBOT_TITLE: "Questions about this job?",
JOB_CHATBOT_PLACEHOLDER: "Ask anything about this position...",
JOB_CHATBOT_WELCOME: "Hi! I can answer questions about this position. What would you like to know?",

// Application
APPLICATION_TITLE: "Apply for this position",
APPLICATION_SUBTITLE: "Fill out the form below to submit your application",
APPLICATION_NAME: "Full Name",
APPLICATION_NAME_PLACEHOLDER: "John Doe",
APPLICATION_EMAIL: "Email Address",
APPLICATION_EMAIL_PLACEHOLDER: "john@example.com",
APPLICATION_PHONE: "Phone Number",
APPLICATION_PHONE_PLACEHOLDER: "+49 123 456 789",
APPLICATION_MESSAGE: "Cover Letter (Optional)",
APPLICATION_MESSAGE_PLACEHOLDER: "Tell us why you're interested in this role...",
APPLICATION_CV_UPLOAD: "Upload your CV",
APPLICATION_CV_FORMATS: "PDF or DOCX, max 10MB",
APPLICATION_CV_REQUIRED: "Please upload your CV",
APPLICATION_SUBMIT: "Submit Application",
APPLICATION_SUBMITTING: "Submitting...",
APPLICATION_SUCCESS_TITLE: "Application Submitted!",
APPLICATION_SUCCESS_DESC: "Thank you for applying. We'll review your application and get back to you soon.",
APPLICATION_BACK_TO_JOBS: "Back to Jobs",

// CV Review
CV_REVIEW_TITLE: "Free CV Review",
CV_REVIEW_DESC: "Get instant AI-powered feedback on your CV",
CV_REVIEW_UPLOAD: "Upload your CV for analysis",
CV_REVIEW_ANALYZING: "Analyzing your CV...",
CV_REVIEW_RESULTS: "Your CV Analysis",
CV_REVIEW_SCORE: "Overall Score",
CV_REVIEW_STRENGTHS: "Strengths",
CV_REVIEW_IMPROVEMENTS: "Areas for Improvement",
CV_REVIEW_MISSING: "Missing Elements",
CV_REVIEW_TRY_ANOTHER: "Analyze another CV",

// Admin Jobs
ADMIN_JOBS_TITLE: "Manage Jobs",
ADMIN_JOBS_CREATE: "Create Job",
ADMIN_JOBS_EDIT: "Edit Job",
ADMIN_JOBS_ACTIVATE: "Activate",
ADMIN_JOBS_DEACTIVATE: "Deactivate",
ADMIN_JOBS_DELETE: "Delete",
ADMIN_JOBS_DELETE_CONFIRM: "Are you sure you want to delete this job?",
ADMIN_JOBS_EMPTY: "No jobs yet. Create your first job posting.",

// Admin Applications
ADMIN_APPLICATIONS_TITLE: "Applications",
ADMIN_APPLICATIONS_EMPTY: "No applications yet.",
ADMIN_APPLICATION_SCORE: "AI Score",
ADMIN_APPLICATION_STATUS: "Status",
ADMIN_APPLICATION_STATUS_NEW: "New",
ADMIN_APPLICATION_STATUS_REVIEWED: "Reviewed",
ADMIN_APPLICATION_STATUS_SHORTLISTED: "Shortlisted",
ADMIN_APPLICATION_STATUS_REJECTED: "Rejected",
ADMIN_APPLICATION_ANALYSIS: "AI Analysis",
ADMIN_APPLICATION_SKILLS: "Matched Skills",
ADMIN_APPLICATION_GAPS: "Missing Skills",
ADMIN_APPLICATION_RED_FLAGS: "Red Flags",
ADMIN_APPLICATION_QUESTIONS: "Suggested Interview Questions",
ADMIN_APPLICATION_DOWNLOAD_CV: "Download CV",

// Employment types
EMPLOYMENT_TYPE_FULL_TIME: "Full-time",
EMPLOYMENT_TYPE_PART_TIME: "Part-time",
EMPLOYMENT_TYPE_CONTRACT: "Contract",
EMPLOYMENT_TYPE_FREELANCE: "Freelance",

// Industries
INDUSTRY_TECHNOLOGY: "Technology",
INDUSTRY_FINANCE: "Finance",
INDUSTRY_HEALTHCARE: "Healthcare",
INDUSTRY_MARKETING: "Marketing",
INDUSTRY_SALES: "Sales",
INDUSTRY_ENGINEERING: "Engineering",
INDUSTRY_DESIGN: "Design",
INDUSTRY_OPERATIONS: "Operations",

// Locations
LOCATION_REMOTE: "Remote",
LOCATION_BERLIN: "Berlin",
LOCATION_MUNICH: "Munich",
LOCATION_HAMBURG: "Hamburg",
LOCATION_FRANKFURT: "Frankfurt",
LOCATION_HYBRID: "Hybrid",
```

**Step 2: Add German keys**

Add to `src/lib/intl/locales/de.ts`:

```typescript
// Jobs
JOBS_TITLE: "Offene Stellen",
JOBS_SUBTITLE: "Finden Sie Ihre nächste Chance",
JOBS_EMPTY: "Keine Stellen gefunden, die Ihren Kriterien entsprechen.",
JOBS_LOADING: "Stellen werden geladen...",
JOBS_FILTER_LOCATION: "Standort",
JOBS_FILTER_TYPE: "Beschäftigungsart",
JOBS_FILTER_INDUSTRY: "Branche",
JOBS_FILTER_CLEAR: "Filter löschen",
JOBS_FILTER_ALL: "Alle",
JOBS_CARD_LOCATION: "Standort",
JOBS_CARD_TYPE: "Art",
JOBS_CARD_SALARY: "Gehalt",
JOBS_VIEW_DETAILS: "Details ansehen",
JOBS_APPLY_NOW: "Jetzt bewerben",
JOBS_POSTED: "Veröffentlicht",

// Job Detail
JOB_DETAIL_REQUIREMENTS: "Anforderungen",
JOB_DETAIL_BENEFITS: "Benefits",
JOB_DETAIL_ABOUT: "Über diese Rolle",
JOB_DETAIL_BACK: "Zurück zu den Stellen",
JOB_CHATBOT_TITLE: "Fragen zu dieser Stelle?",
JOB_CHATBOT_PLACEHOLDER: "Fragen Sie alles über diese Position...",
JOB_CHATBOT_WELCOME: "Hallo! Ich kann Fragen zu dieser Position beantworten. Was möchten Sie wissen?",

// Application
APPLICATION_TITLE: "Für diese Position bewerben",
APPLICATION_SUBTITLE: "Füllen Sie das Formular aus, um Ihre Bewerbung einzureichen",
APPLICATION_NAME: "Vollständiger Name",
APPLICATION_NAME_PLACEHOLDER: "Max Mustermann",
APPLICATION_EMAIL: "E-Mail-Adresse",
APPLICATION_EMAIL_PLACEHOLDER: "max@beispiel.de",
APPLICATION_PHONE: "Telefonnummer",
APPLICATION_PHONE_PLACEHOLDER: "+49 123 456 789",
APPLICATION_MESSAGE: "Anschreiben (Optional)",
APPLICATION_MESSAGE_PLACEHOLDER: "Erzählen Sie uns, warum Sie an dieser Rolle interessiert sind...",
APPLICATION_CV_UPLOAD: "Laden Sie Ihren Lebenslauf hoch",
APPLICATION_CV_FORMATS: "PDF oder DOCX, max 10MB",
APPLICATION_CV_REQUIRED: "Bitte laden Sie Ihren Lebenslauf hoch",
APPLICATION_SUBMIT: "Bewerbung einreichen",
APPLICATION_SUBMITTING: "Wird eingereicht...",
APPLICATION_SUCCESS_TITLE: "Bewerbung eingereicht!",
APPLICATION_SUCCESS_DESC: "Vielen Dank für Ihre Bewerbung. Wir werden Ihre Bewerbung prüfen und uns bald bei Ihnen melden.",
APPLICATION_BACK_TO_JOBS: "Zurück zu den Stellen",

// CV Review
CV_REVIEW_TITLE: "Kostenlose Lebenslauf-Prüfung",
CV_REVIEW_DESC: "Erhalten Sie sofortiges KI-gestütztes Feedback zu Ihrem Lebenslauf",
CV_REVIEW_UPLOAD: "Laden Sie Ihren Lebenslauf zur Analyse hoch",
CV_REVIEW_ANALYZING: "Ihr Lebenslauf wird analysiert...",
CV_REVIEW_RESULTS: "Ihre Lebenslauf-Analyse",
CV_REVIEW_SCORE: "Gesamtbewertung",
CV_REVIEW_STRENGTHS: "Stärken",
CV_REVIEW_IMPROVEMENTS: "Verbesserungsbereiche",
CV_REVIEW_MISSING: "Fehlende Elemente",
CV_REVIEW_TRY_ANOTHER: "Einen anderen Lebenslauf analysieren",

// Admin Jobs
ADMIN_JOBS_TITLE: "Stellen verwalten",
ADMIN_JOBS_CREATE: "Stelle erstellen",
ADMIN_JOBS_EDIT: "Stelle bearbeiten",
ADMIN_JOBS_ACTIVATE: "Aktivieren",
ADMIN_JOBS_DEACTIVATE: "Deaktivieren",
ADMIN_JOBS_DELETE: "Löschen",
ADMIN_JOBS_DELETE_CONFIRM: "Sind Sie sicher, dass Sie diese Stelle löschen möchten?",
ADMIN_JOBS_EMPTY: "Noch keine Stellen. Erstellen Sie Ihre erste Stellenausschreibung.",

// Admin Applications
ADMIN_APPLICATIONS_TITLE: "Bewerbungen",
ADMIN_APPLICATIONS_EMPTY: "Noch keine Bewerbungen.",
ADMIN_APPLICATION_SCORE: "KI-Bewertung",
ADMIN_APPLICATION_STATUS: "Status",
ADMIN_APPLICATION_STATUS_NEW: "Neu",
ADMIN_APPLICATION_STATUS_REVIEWED: "Geprüft",
ADMIN_APPLICATION_STATUS_SHORTLISTED: "Vorauswahl",
ADMIN_APPLICATION_STATUS_REJECTED: "Abgelehnt",
ADMIN_APPLICATION_ANALYSIS: "KI-Analyse",
ADMIN_APPLICATION_SKILLS: "Passende Fähigkeiten",
ADMIN_APPLICATION_GAPS: "Fehlende Fähigkeiten",
ADMIN_APPLICATION_RED_FLAGS: "Warnsignale",
ADMIN_APPLICATION_QUESTIONS: "Vorgeschlagene Interviewfragen",
ADMIN_APPLICATION_DOWNLOAD_CV: "Lebenslauf herunterladen",

// Employment types
EMPLOYMENT_TYPE_FULL_TIME: "Vollzeit",
EMPLOYMENT_TYPE_PART_TIME: "Teilzeit",
EMPLOYMENT_TYPE_CONTRACT: "Befristet",
EMPLOYMENT_TYPE_FREELANCE: "Freiberuflich",

// Industries
INDUSTRY_TECHNOLOGY: "Technologie",
INDUSTRY_FINANCE: "Finanzen",
INDUSTRY_HEALTHCARE: "Gesundheitswesen",
INDUSTRY_MARKETING: "Marketing",
INDUSTRY_SALES: "Vertrieb",
INDUSTRY_ENGINEERING: "Ingenieurwesen",
INDUSTRY_DESIGN: "Design",
INDUSTRY_OPERATIONS: "Betrieb",

// Locations
LOCATION_REMOTE: "Remote",
LOCATION_BERLIN: "Berlin",
LOCATION_MUNICH: "München",
LOCATION_HAMBURG: "Hamburg",
LOCATION_FRANKFURT: "Frankfurt",
LOCATION_HYBRID: "Hybrid",
```

**Step 3: Add Portuguese keys**

Add to `src/lib/intl/locales/pt.ts` (similar structure, translate appropriately)

---

## Phase 3: oRPC Routes

### Task 6: Create Public Jobs oRPC Routes

**Files:**

- Create: `src/orpc/routes/jobs.ts`
- Modify: `src/orpc/index.ts`

**Step 1: Create jobs routes**

```typescript
// src/orpc/routes/jobs.ts
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { z } from "zod";

import { jobs } from "@/lib/db/schema";

import { orpc, publicProcedure } from "../orpc-server";

export const jobsRouter = orpc.router({
  list: publicProcedure
    .input(
      z.object({
        location: z.string().optional(),
        employmentType: z.string().optional(),
        industry: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .handler(async ({ input, context }) => {
      const conditions = [eq(jobs.isActive, true)];

      if (input.location) {
        conditions.push(eq(jobs.location, input.location));
      }
      if (input.employmentType) {
        conditions.push(eq(jobs.employmentType, input.employmentType));
      }
      if (input.industry) {
        conditions.push(eq(jobs.industry, input.industry));
      }
      if (input.search) {
        conditions.push(
          sql`(${jobs.title} ILIKE ${`%${input.search}%`} OR ${jobs.description} ILIKE ${`%${input.search}%`})`
        );
      }

      const [jobsList, countResult] = await Promise.all([
        context.db
          .select()
          .from(jobs)
          .where(and(...conditions))
          .orderBy(desc(jobs.createdAt))
          .limit(input.limit)
          .offset(input.offset),
        context.db
          .select({ count: sql<number>`count(*)` })
          .from(jobs)
          .where(and(...conditions)),
      ]);

      return {
        jobs: jobsList,
        total: Number(countResult[0]?.count ?? 0),
        hasMore:
          input.offset + jobsList.length < Number(countResult[0]?.count ?? 0),
      };
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .handler(async ({ input, context }) => {
      const [job] = await context.db
        .select()
        .from(jobs)
        .where(and(eq(jobs.slug, input.slug), eq(jobs.isActive, true)))
        .limit(1);

      if (!job) {
        throw new Error("Job not found");
      }

      return job;
    }),
});
```

**Step 2: Add to router index**

Modify `src/orpc/index.ts` to include `jobsRouter`.

---

### Task 7: Create Applications oRPC Routes

**Files:**

- Create: `src/orpc/routes/applications.ts`

**Step 1: Create applications routes**

```typescript
// src/orpc/routes/applications.ts
import { eq } from "drizzle-orm";
import { z } from "zod";

import { applications, file, jobs } from "@/lib/db/schema";
import { env } from "@/lib/env.server";
import { storage } from "@/lib/storage";

import { orpc, publicProcedure } from "../orpc-server";

export const applicationsRouter = orpc.router({
  create: publicProcedure
    .input(
      z.object({
        jobSlug: z.string(),
        fullName: z.string().min(2),
        email: z.string().email(),
        phone: z.string().optional(),
        message: z.string().optional(),
        cvFile: z.instanceof(File),
      })
    )
    .handler(async ({ input, context }) => {
      // Get job by slug
      const [job] = await context.db
        .select()
        .from(jobs)
        .where(eq(jobs.slug, input.jobSlug))
        .limit(1);

      if (!job) {
        throw new Error("Job not found");
      }

      // Upload CV to storage
      const cvKey = `applications/${job.id}/${crypto.randomUUID()}-${input.cvFile.name}`;
      const arrayBuffer = await input.cvFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await storage.uploadBuffer(buffer, cvKey, {
        contentType: input.cvFile.type,
      });

      // Create file record
      const fileId = crypto.randomUUID();
      await context.db.insert(file).values({
        id: fileId,
        key: cvKey,
        provider: env.STORAGE_PROVIDER,
        bucket: env.S3_BUCKET ?? null,
        size: input.cvFile.size,
        mimeType: input.cvFile.type,
        fileName: input.cvFile.name,
        userId: "guest",
        purpose: "application_cv",
        metadata: { jobId: job.id },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create application
      const applicationId = crypto.randomUUID();
      const [application] = await context.db
        .insert(applications)
        .values({
          id: applicationId,
          jobId: job.id,
          fullName: input.fullName,
          email: input.email,
          phone: input.phone ?? null,
          message: input.message ?? null,
          cvFileId: fileId,
          cvFileKey: cvKey,
          status: "new",
        })
        .returning();

      // TODO: Trigger AI scoring in background
      // TODO: Send confirmation email

      return {
        id: application.id,
        success: true,
      };
    }),
});
```

---

### Task 8: Create Admin Jobs oRPC Routes

**Files:**

- Create: `src/orpc/routes/admin/jobs.ts`

**Step 1: Create admin jobs routes**

```typescript
// src/orpc/routes/admin/jobs.ts
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { isAdminEmail } from "@/lib/auth/admin-check";
import { jobs } from "@/lib/db/schema";

import { orpc, protectedProcedure } from "../../orpc-server";

const adminProcedure = protectedProcedure.use(async ({ context, next }) => {
  if (!isAdminEmail(context.session?.user?.email)) {
    throw new Error("Unauthorized: Admin access required");
  }
  return next({ context });
});

const jobInput = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  location: z.string(),
  employmentType: z.string(),
  industry: z.string(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  isActive: z.boolean().default(true),
});

export const adminJobsRouter = orpc.router({
  list: adminProcedure.handler(async ({ context }) => {
    const jobsList = await context.db
      .select()
      .from(jobs)
      .orderBy(desc(jobs.createdAt));

    return { jobs: jobsList };
  }),

  get: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const [job] = await context.db
        .select()
        .from(jobs)
        .where(eq(jobs.id, input.id))
        .limit(1);

      if (!job) {
        throw new Error("Job not found");
      }

      return job;
    }),

  create: adminProcedure.input(jobInput).handler(async ({ input, context }) => {
    const [job] = await context.db
      .insert(jobs)
      .values({
        id: crypto.randomUUID(),
        ...input,
        salaryMin: input.salaryMin ?? null,
        salaryMax: input.salaryMax ?? null,
      })
      .returning();

    return job;
  }),

  update: adminProcedure
    .input(z.object({ id: z.string() }).merge(jobInput.partial()))
    .handler(async ({ input, context }) => {
      const { id, ...data } = input;

      const [job] = await context.db
        .update(jobs)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, id))
        .returning();

      return job;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      await context.db.delete(jobs).where(eq(jobs.id, input.id));
      return { success: true };
    }),

  toggleActive: adminProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .handler(async ({ input, context }) => {
      const [job] = await context.db
        .update(jobs)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(eq(jobs.id, input.id))
        .returning();

      return job;
    }),
});
```

---

### Task 9: Create Admin Applications oRPC Routes

**Files:**

- Create: `src/orpc/routes/admin/applications.ts`

**Step 1: Create admin applications routes**

```typescript
// src/orpc/routes/admin/applications.ts
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { isAdminEmail } from "@/lib/auth/admin-check";
import { applications, file, jobs } from "@/lib/db/schema";
import { storage } from "@/lib/storage";

import { orpc, protectedProcedure } from "../../orpc-server";

const adminProcedure = protectedProcedure.use(async ({ context, next }) => {
  if (!isAdminEmail(context.session?.user?.email)) {
    throw new Error("Unauthorized: Admin access required");
  }
  return next({ context });
});

export const adminApplicationsRouter = orpc.router({
  list: adminProcedure
    .input(
      z.object({
        jobId: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .handler(async ({ input, context }) => {
      let query = context.db
        .select({
          application: applications,
          job: jobs,
        })
        .from(applications)
        .leftJoin(jobs, eq(applications.jobId, jobs.id))
        .orderBy(desc(applications.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      if (input.jobId) {
        query = query.where(eq(applications.jobId, input.jobId));
      }
      if (input.status) {
        query = query.where(eq(applications.status, input.status));
      }

      const results = await query;

      return {
        applications: results.map((r) => ({
          ...r.application,
          job: r.job,
        })),
      };
    }),

  get: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const [result] = await context.db
        .select({
          application: applications,
          job: jobs,
          cvFile: file,
        })
        .from(applications)
        .leftJoin(jobs, eq(applications.jobId, jobs.id))
        .leftJoin(file, eq(applications.cvFileId, file.id))
        .where(eq(applications.id, input.id))
        .limit(1);

      if (!result) {
        throw new Error("Application not found");
      }

      // Get CV download URL
      let cvUrl: string | null = null;
      if (result.application.cvFileKey) {
        cvUrl = await storage.getUrl(result.application.cvFileKey, 3600);
      }

      return {
        ...result.application,
        job: result.job,
        cvFile: result.cvFile,
        cvUrl,
      };
    }),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["new", "reviewed", "shortlisted", "rejected"]),
      })
    )
    .handler(async ({ input, context }) => {
      const [application] = await context.db
        .update(applications)
        .set({ status: input.status })
        .where(eq(applications.id, input.id))
        .returning();

      return application;
    }),
});
```

---

## Phase 4: AI Implementation

### Task 10: Create CV Parser

**Files:**

- Create: `src/lib/ai/cv-parser.ts`

**Step 1: Create CV analysis module**

```typescript
// src/lib/ai/cv-parser.ts
import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";

export const cvAnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100).describe("Overall CV quality score"),
  strengths: z.array(z.string()).describe("Key strengths of the CV"),
  improvements: z
    .array(z.string())
    .describe("Specific actionable improvements"),
  missingElements: z
    .array(z.string())
    .describe("Important missing sections or info"),
  extractedSkills: z.array(z.string()).describe("Skills found in the CV"),
  experienceYears: z
    .number()
    .nullable()
    .describe("Estimated years of experience"),
  educationLevel: z.string().nullable().describe("Highest education level"),
  fitScore: z
    .number()
    .min(0)
    .max(100)
    .nullable()
    .describe("Job fit score if job provided"),
  matchedSkills: z
    .array(z.string())
    .nullable()
    .describe("Skills matching job requirements"),
  missingSkills: z
    .array(z.string())
    .nullable()
    .describe("Required skills not found"),
  redFlags: z.array(z.string()).nullable().describe("Potential concerns"),
  interviewQuestions: z
    .array(z.string())
    .nullable()
    .describe("5 tailored interview questions"),
});

export type CVAnalysis = z.infer<typeof cvAnalysisSchema>;

async function toDataUrl(input: {
  fileDataUrl: string;
  mediaType: string;
}): Promise<string> {
  if (input.fileDataUrl.startsWith("data:")) {
    return input.fileDataUrl;
  }

  const response = await fetch(input.fileDataUrl);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return `data:${input.mediaType};base64,${base64}`;
}

export async function analyzeCV(input: {
  fileDataUrl: string;
  mediaType: string;
  jobRequirements?: string;
}): Promise<CVAnalysis> {
  const dataUrl = await toDataUrl({
    fileDataUrl: input.fileDataUrl,
    mediaType: input.mediaType,
  });

  const jobContext = input.jobRequirements
    ? `
**Job Requirements to evaluate against:**
${input.jobRequirements}

Include fitScore, matchedSkills, missingSkills, redFlags, and interviewQuestions in your analysis.
`
    : `
No job requirements provided. Set fitScore, matchedSkills, missingSkills, redFlags, and interviewQuestions to null.
`;

  const { output } = await generateText({
    model: openai("gpt-4o"),
    output: Output.object({ schema: cvAnalysisSchema }),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are an expert CV/resume analyst. Analyze this CV thoroughly.

**Instructions:**
1. Evaluate overall quality (formatting, clarity, completeness)
2. Extract key skills and experience
3. Identify strengths and areas for improvement
4. Note any missing important elements
${jobContext}

**Scoring guide:**
- 90-100: Exceptional CV, well-structured, comprehensive
- 70-89: Good CV with minor improvements needed
- 50-69: Average CV, several areas need work
- Below 50: Significant improvements required

Be specific and actionable in your feedback.`,
          },
          {
            type: "file",
            data: dataUrl,
            mediaType: input.mediaType,
          },
        ],
      },
    ],
  });

  if (!output) {
    throw new Error("Failed to analyze CV");
  }

  return output;
}
```

---

### Task 11: Create CV Review API Route

**Files:**

- Create: `src/routes/api/ai/cv-review.ts`

**Step 1: Create CV review endpoint**

```typescript
// src/routes/api/ai/cv-review.ts
import { createFileRoute } from "@tanstack/react-router";

import { analyzeCV } from "@/lib/ai/cv-parser";

export const Route = createFileRoute("/api/ai/cv-review")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const formData = await request.formData();
          const file = formData.get("file") as File | null;

          if (!file) {
            return new Response(JSON.stringify({ error: "No file provided" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Validate file type
          const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ];
          if (!allowedTypes.includes(file.type)) {
            return new Response(
              JSON.stringify({
                error: "Invalid file type. Please upload PDF or DOCX.",
              }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          // Convert to data URL
          const arrayBuffer = await file.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString("base64");
          const dataUrl = `data:${file.type};base64,${base64}`;

          // Analyze CV (no job context for standalone review)
          const analysis = await analyzeCV({
            fileDataUrl: dataUrl,
            mediaType: file.type,
          });

          return new Response(JSON.stringify(analysis), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("CV review error:", error);
          return new Response(
            JSON.stringify({ error: "Failed to analyze CV" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
```

---

### Task 12: Create Job Chatbot API Route

**Files:**

- Create: `src/routes/api/ai/job-chat.ts`

**Step 1: Create job chat endpoint**

```typescript
// src/routes/api/ai/job-chat.ts
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";

export const Route = createFileRoute("/api/ai/job-chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const { jobId, messages } = await request.json();

          // Get job details
          const [job] = await db
            .select()
            .from(jobs)
            .where(eq(jobs.id, jobId))
            .limit(1);

          if (!job) {
            return new Response(JSON.stringify({ error: "Job not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          const systemPrompt = `You are a helpful recruiting assistant for ZaikaConnect. You help candidates learn about job opportunities and guide them through the application process.

**Current Job:**
Title: ${job.title}
Location: ${job.location}
Type: ${job.employmentType}

**Description:**
${job.description}

**Requirements:**
${job.requirements ?? "Not specified"}

**Benefits:**
${job.benefits ?? "Not specified"}

${job.salaryMin && job.salaryMax ? `**Salary Range:** €${job.salaryMin.toLocaleString()} - €${job.salaryMax.toLocaleString()}` : ""}

**Guidelines:**
- Answer questions about this specific job
- Be concise and helpful
- If asked about other jobs, suggest they browse the jobs page
- Encourage qualified candidates to apply
- Don't make up information not in the job description
- If unsure, suggest they contact the recruiting team`;

          const result = streamText({
            model: openai("gpt-4o-mini"),
            system: systemPrompt,
            messages,
          });

          return result.toDataStreamResponse();
        } catch (error) {
          console.error("Job chat error:", error);
          return new Response(JSON.stringify({ error: "Chat failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
```

---

## Phase 5: Public Pages

### Task 13: Create Jobs List Page

**Files:**

- Create: `src/routes/jobs/index.tsx`
- Create: `src/features/jobs/job-card.tsx`
- Create: `src/features/jobs/job-filters.tsx`

**Step 1: Create JobCard component**

```typescript
// src/features/jobs/job-card.tsx
import { MapPinIcon, BriefcaseIcon, CalendarIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format-date";

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

export function JobCard({ job }: { job: Job }) {
  const { t } = useTranslation();

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `€${min.toLocaleString()} - €${max.toLocaleString()}`;
    if (min) return `From €${min.toLocaleString()}`;
    return `Up to €${max?.toLocaleString()}`;
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{job.title}</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-4">
              <span className="flex items-center gap-1">
                <MapPinIcon className="size-4" />
                {t(`LOCATION_${job.location.toUpperCase()}`)}
              </span>
              <span className="flex items-center gap-1">
                <BriefcaseIcon className="size-4" />
                {t(`EMPLOYMENT_TYPE_${job.employmentType.toUpperCase().replace("-", "_")}`)}
              </span>
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {t(`INDUSTRY_${job.industry.toUpperCase()}`)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-muted-foreground line-clamp-3">
          {job.description.slice(0, 200)}...
        </p>
        {formatSalary(job.salaryMin, job.salaryMax) && (
          <p className="mt-2 font-medium">
            {formatSalary(job.salaryMin, job.salaryMax)}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <span className="text-muted-foreground flex items-center gap-1 text-sm">
          <CalendarIcon className="size-4" />
          {t("JOBS_POSTED")} {formatDate(job.createdAt)}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/jobs/$slug" params={{ slug: job.slug }}>
              {t("JOBS_VIEW_DETAILS")}
            </Link>
          </Button>
          <Button asChild>
            <Link to="/apply/$jobSlug" params={{ jobSlug: job.slug }}>
              {t("JOBS_APPLY_NOW")}
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
```

**Step 2: Create JobFilters component**

```typescript
// src/features/jobs/job-filters.tsx
import { useTranslation } from "react-i18next";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  EMPLOYMENT_TYPES,
  INDUSTRIES,
  LOCATIONS,
} from "@/lib/constants/recruiting";

type Filters = {
  location?: string;
  employmentType?: string;
  industry?: string;
};

type Props = {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
};

export function JobFilters({ filters, onFilterChange }: Props) {
  const { t } = useTranslation();

  const handleChange = (key: keyof Filters, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value === "all" ? undefined : value,
    });
  };

  const handleClear = () => {
    onFilterChange({});
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Select
        value={filters.location ?? "all"}
        onValueChange={(v) => handleChange("location", v)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t("JOBS_FILTER_LOCATION")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("JOBS_FILTER_ALL")}</SelectItem>
          {LOCATIONS.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {t(`LOCATION_${loc.toUpperCase()}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.employmentType ?? "all"}
        onValueChange={(v) => handleChange("employmentType", v)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t("JOBS_FILTER_TYPE")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("JOBS_FILTER_ALL")}</SelectItem>
          {EMPLOYMENT_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {t(`EMPLOYMENT_TYPE_${type.toUpperCase().replace("-", "_")}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.industry ?? "all"}
        onValueChange={(v) => handleChange("industry", v)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t("JOBS_FILTER_INDUSTRY")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("JOBS_FILTER_ALL")}</SelectItem>
          {INDUSTRIES.map((ind) => (
            <SelectItem key={ind} value={ind}>
              {t(`INDUSTRY_${ind.toUpperCase()}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(filters.location || filters.employmentType || filters.industry) && (
        <Button variant="ghost" onClick={handleClear}>
          {t("JOBS_FILTER_CLEAR")}
        </Button>
      )}
    </div>
  );
}
```

**Step 3: Create jobs list page**

```typescript
// src/routes/jobs/index.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";

import { orpc } from "@/orpc/orpc-client";
import { JobCard } from "@/features/jobs/job-card";
import { JobFilters } from "@/features/jobs/job-filters";
import { Spinner } from "@/components/spinner";

export const Route = createFileRoute("/jobs/")({
  component: JobsPage,
});

function JobsPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<{
    location?: string;
    employmentType?: string;
    industry?: string;
  }>({});

  const { data, isLoading } = orpc.jobs.list.useQuery({
    input: filters,
  });

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("JOBS_TITLE")}</h1>
        <p className="text-muted-foreground mt-2">{t("JOBS_SUBTITLE")}</p>
      </div>

      <div className="mb-6">
        <JobFilters filters={filters} onFilterChange={setFilters} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : data?.jobs.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">{t("JOBS_EMPTY")}</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {data?.jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### Task 14: Create Job Detail Page

**Files:**

- Create: `src/routes/jobs/$slug.tsx`
- Create: `src/features/jobs/job-detail.tsx`

(Continue with similar detailed implementation...)

---

### Task 15: Create Application Form Page

**Files:**

- Create: `src/routes/apply/$jobSlug.tsx`
- Create: `src/features/applications/application-form.tsx`

---

### Task 16: Create CV Review Page

**Files:**

- Create: `src/routes/cv-review.tsx`
- Create: `src/features/cv-review/cv-review-page.tsx`
- Create: `src/features/cv-review/feedback-cards.tsx`

---

## Phase 6: Admin Dashboard

### Task 17: Create Admin Jobs Page

**Files:**

- Create: `src/routes/dashboard/jobs/index.tsx`

---

### Task 18: Create Admin Applications Page

**Files:**

- Create: `src/routes/dashboard/applications/index.tsx`
- Create: `src/routes/dashboard/applications/$id.tsx`

---

## Phase 7: Job Page Chatbot

### Task 19: Create Chat Widget Component

**Files:**

- Create: `src/features/jobs/chat-widget.tsx`

---

## Phase 8: Email Notifications

### Task 20: Create Application Confirmation Email

**Files:**

- Create: `src/components/emails/application-confirmation-email.tsx`

---

## Phase 9: Integration & Polish

### Task 21: Update Landing Page CTAs

**Files:**

- Modify: `src/routes/index.tsx`
- Modify: Landing components to link to `/jobs`

---

### Task 22: Add Sidebar Navigation for Admin

**Files:**

- Modify: `src/components/nav-items.tsx`

---

### Task 23: Background AI Scoring on Application Submit

**Files:**

- Modify: `src/orpc/routes/applications.ts`

---

## Verification Checklist

- [ ] Database migrations run successfully
- [ ] Seed data creates jobs
- [ ] Public can browse jobs without auth
- [ ] Public can apply with CV upload
- [ ] CV Review tool works standalone
- [ ] Admin can manage jobs (CRUD)
- [ ] Admin can view applications with AI scores
- [ ] Job chatbot responds with job context
- [ ] Confirmation email sends on application
- [ ] i18n works for all new strings
- [ ] All routes protected appropriately
