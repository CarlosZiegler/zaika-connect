import { relations } from "drizzle-orm";
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

export const candidates = pgTable("candidates", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

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
