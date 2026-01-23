# ZaikaConnect Recruiting Platform Design

## Overview

Transform the existing SaaS boilerplate into a recruiting platform with AI-powered features.

**Users:**

- **Guest** - Browse jobs, apply, use CV review tool
- **Admin** (env whitelist) - Manage jobs, view applications, see AI scores

## Features

### Public Features

1. **Job Board** - Browse/filter jobs by location, type, industry
2. **Job Detail + Chatbot** - View job, ask questions via AI chat
3. **Application Flow** - Submit application with CV upload (no account needed)
4. **CV Review Tool** - Standalone AI feedback on CV quality

### Admin Features

1. **Jobs CRUD** - Create, edit, activate/deactivate jobs
2. **Applications List** - View all with AI fit scores
3. **Application Detail** - Full AI analysis (skills, gaps, red flags, interview questions)

## Database Schema

### New Tables (`src/lib/db/schema/recruiting.ts`)

```typescript
// Jobs table
export const jobs = pgTable("jobs", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements"),
  benefits: text("benefits"),
  location: text("location").notNull(),
  employmentType: text("employment_type").notNull(), // full-time, part-time, contract
  industry: text("industry").notNull(),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Applications table
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
  aiScore: integer("ai_score"), // 0-100, filled async
  aiAnalysis: json("ai_analysis").$type<CVAnalysis>(),
  status: text("status").default("new").notNull(), // new, reviewed, shortlisted, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### Fixed Constants

```typescript
// src/lib/constants/recruiting.ts
export const EMPLOYMENT_TYPES = [
  "full-time",
  "part-time",
  "contract",
  "freelance",
] as const;

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

export const LOCATIONS = [
  "remote",
  "berlin",
  "munich",
  "hamburg",
  "frankfurt",
  "hybrid",
] as const;

export const APPLICATION_STATUSES = [
  "new",
  "reviewed",
  "shortlisted",
  "rejected",
] as const;
```

## API Routes (oRPC)

### Public Routes

```typescript
// src/orpc/routes/jobs.ts
jobs.list; // filters: location, type, industry + pagination
jobs.getBySlug; // single job by slug

// src/orpc/routes/applications.ts
applications.create; // form data + CV file → upload, save, trigger AI scoring, send email
```

### Admin Routes

```typescript
// src/orpc/routes/admin/jobs.ts
admin.jobs.list;
admin.jobs.create;
admin.jobs.update;
admin.jobs.delete;

// src/orpc/routes/admin/applications.ts
admin.applications.list; // with AI scores, filters
admin.applications.get; // full AI analysis
admin.applications.updateStatus;
```

## AI Implementation

### CV Parser (`src/lib/ai/cv-parser.ts`)

Uses Vercel AI SDK with file upload pattern:

```typescript
import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";

const cvAnalysisSchema = z.object({
  // Candidate feedback
  overallScore: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  missingElements: z.array(z.string()),

  // Extracted data
  extractedSkills: z.array(z.string()),
  experienceYears: z.number().nullable(),
  educationLevel: z.string().nullable(),

  // Job-fit analysis (when job provided)
  fitScore: z.number().min(0).max(100).nullable(),
  matchedSkills: z.array(z.string()).nullable(),
  missingSkills: z.array(z.string()).nullable(),
  redFlags: z.array(z.string()).nullable(),
  interviewQuestions: z.array(z.string()).nullable(),
});

export async function analyzeCV(input: {
  fileDataUrl: string;
  mediaType: string;
  jobRequirements?: string;
}): Promise<CVAnalysis> {
  const { output } = await generateText({
    model: openai("gpt-4o"),
    output: Output.object({ schema: cvAnalysisSchema }),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: buildPrompt(input.jobRequirements) },
          { type: "file", data: input.fileDataUrl, mediaType: input.mediaType },
        ],
      },
    ],
  });
  return output;
}
```

### Job Chatbot (`src/routes/api/ai/job-chat.ts`)

```typescript
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

// POST /api/ai/job-chat
export async function POST(request: Request) {
  const { jobId, message, history } = await request.json();
  const job = await getJobById(jobId);

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: `You are a helpful recruiting assistant for ZaikaConnect.
Answer questions about this job:

Title: ${job.title}
Description: ${job.description}
Requirements: ${job.requirements}
Location: ${job.location}
Type: ${job.employmentType}

Guide candidates to apply. Be concise and helpful.`,
    messages: history,
  });

  return result.toDataStreamResponse();
}
```

### CV Review API (`src/routes/api/ai/cv-review.ts`)

```typescript
// POST /api/ai/cv-review
// Input: file (PDF/DOCX)
// Output: feedback only (no job context)
// No file stored - privacy friendly
```

## Pages & Routes

### Public Routes

| Route              | Description                        |
| ------------------ | ---------------------------------- |
| `/`                | Landing page (update CTAs to jobs) |
| `/jobs`            | Job board with filters             |
| `/jobs/[slug]`     | Job detail + AI chatbot            |
| `/apply/[jobSlug]` | Application form + CV upload       |
| `/cv-review`       | Standalone CV feedback tool        |

### Admin Routes (existing dashboard)

| Route                          | Description                    |
| ------------------------------ | ------------------------------ |
| `/dashboard/jobs`              | Jobs list + CRUD               |
| `/dashboard/applications`      | Applications with AI scores    |
| `/dashboard/applications/[id]` | Full application + AI analysis |

## Auth & Access Control

### Admin Whitelist

```env
# .env
ADMIN_EMAILS=admin@zaikaconnect.com,recruiter@zaikaconnect.com
```

```typescript
// src/lib/auth/admin-check.ts
export function isAdminEmail(email: string): boolean {
  const whitelist =
    env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) ?? [];
  return whitelist.includes(email.toLowerCase());
}
```

### Route Protection

- Public routes: no auth required
- Dashboard routes: check `isAdminEmail(session.user.email)`
- Signup: either disabled or check whitelist on registration

## Email Notifications

### Application Confirmation (`src/components/emails/application-confirmation-email.tsx`)

Sent to candidate after successful application:

- Confirm receipt
- Job title applied for
- What to expect next

Uses existing Resend + React Email setup.

## i18n Keys to Add

```typescript
// Jobs
(JOBS_TITLE, JOBS_SUBTITLE, JOBS_EMPTY, JOBS_LOADING);
(JOBS_FILTER_LOCATION,
  JOBS_FILTER_TYPE,
  JOBS_FILTER_INDUSTRY,
  JOBS_FILTER_CLEAR);
(JOBS_CARD_LOCATION, JOBS_CARD_TYPE, JOBS_CARD_SALARY);
(JOBS_VIEW_DETAILS, JOBS_APPLY_NOW);

// Job Detail
(JOB_DETAIL_REQUIREMENTS, JOB_DETAIL_BENEFITS, JOB_DETAIL_ABOUT);
(JOB_CHATBOT_TITLE, JOB_CHATBOT_PLACEHOLDER, JOB_CHATBOT_SUGGESTIONS);

// Application
(APPLICATION_TITLE, APPLICATION_SUBTITLE);
(APPLICATION_NAME, APPLICATION_EMAIL, APPLICATION_PHONE, APPLICATION_MESSAGE);
(APPLICATION_CV_UPLOAD, APPLICATION_CV_FORMATS, APPLICATION_CV_MAX_SIZE);
(APPLICATION_SUBMIT, APPLICATION_SUBMITTING);
(APPLICATION_SUCCESS_TITLE, APPLICATION_SUCCESS_DESC);

// CV Review
(CV_REVIEW_TITLE, CV_REVIEW_DESC);
(CV_REVIEW_UPLOAD, CV_REVIEW_ANALYZING, CV_REVIEW_RESULTS);
(CV_REVIEW_SCORE, CV_REVIEW_STRENGTHS, CV_REVIEW_IMPROVEMENTS);
(CV_REVIEW_MISSING, CV_REVIEW_TRY_ANOTHER);

// Admin
(ADMIN_JOBS_TITLE, ADMIN_JOBS_CREATE, ADMIN_JOBS_EDIT);
(ADMIN_JOBS_ACTIVATE, ADMIN_JOBS_DEACTIVATE, ADMIN_JOBS_DELETE);
(ADMIN_APPLICATIONS_TITLE, ADMIN_APPLICATIONS_EMPTY);
(ADMIN_APPLICATION_SCORE, ADMIN_APPLICATION_STATUS);
(ADMIN_APPLICATION_ANALYSIS, ADMIN_APPLICATION_SKILLS);
(ADMIN_APPLICATION_GAPS, ADMIN_APPLICATION_RED_FLAGS);
ADMIN_APPLICATION_QUESTIONS;
```

## New Components

### UI Components

- `JobCard` - Job preview card for listings
- `JobFilters` - Filter dropdowns (location, type, industry)
- `ChatWidget` - Floating AI chat for job pages
- `CVUploader` - Dropzone with progress (extend existing)
- `FeedbackCards` - Display AI CV feedback sections
- `AIScoreBadge` - Colored score indicator (0-100)
- `AIAnalysisPanel` - Expandable analysis sections

## Implementation Priority

1. **Database** - Schema, migrations, seed script
2. **Public Jobs** - List, detail pages, filters
3. **Application Flow** - Form, CV upload, storage integration
4. **AI Scoring** - Background analysis on submit
5. **Admin Jobs** - CRUD in dashboard
6. **Admin Applications** - List with scores, detail view
7. **Job Chatbot** - Chat widget on job pages
8. **CV Review Tool** - Standalone feedback page
9. **Email** - Application confirmation
10. **Polish** - i18n, error handling, loading states

## File Structure

```
src/
├── lib/
│   ├── ai/
│   │   └── cv-parser.ts
│   ├── constants/
│   │   └── recruiting.ts
│   └── db/schema/
│       └── recruiting.ts
├── orpc/routes/
│   ├── jobs.ts
│   ├── applications.ts
│   └── admin/
│       ├── jobs.ts
│       └── applications.ts
├── routes/
│   ├── jobs/
│   │   ├── index.tsx
│   │   └── $slug.tsx
│   ├── apply/
│   │   └── $jobSlug.tsx
│   ├── cv-review.tsx
│   ├── api/ai/
│   │   ├── job-chat.ts
│   │   └── cv-review.ts
│   └── dashboard/
│       ├── jobs/
│       │   └── index.tsx
│       └── applications/
│           ├── index.tsx
│           └── $id.tsx
├── features/
│   ├── jobs/
│   │   ├── job-card.tsx
│   │   ├── job-filters.tsx
│   │   ├── job-detail.tsx
│   │   └── chat-widget.tsx
│   ├── applications/
│   │   ├── application-form.tsx
│   │   └── cv-uploader.tsx
│   └── cv-review/
│       ├── cv-review-page.tsx
│       └── feedback-cards.tsx
└── components/
    ├── ai-score-badge.tsx
    └── ai-analysis-panel.tsx
```

## Scripts

```bash
# Generate migrations
bun run db:generate

# Push to database
bun run db:push

# Seed jobs data
bun run scripts/seed-jobs.ts
```
