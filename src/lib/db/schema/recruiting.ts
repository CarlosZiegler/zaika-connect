import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  vector,
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

export const cvs = pgTable(
  "cvs",
  {
    id: text("id").primaryKey(),
    candidateId: text("candidate_id")
      .references(() => candidates.id, { onDelete: "cascade" })
      .notNull(),
    fileId: text("file_id").references(() => file.id),
    fileKey: text("file_key"),
    cvText: text("cv_text"),
    cvEmbedding: vector("cv_embedding", { dimensions: 1536 }),
    aiScore: integer("ai_score"),
    aiAnalysis: json("ai_analysis").$type<CVAnalysis>(),
    processingStatus: text("processing_status").default("pending").notNull(),
    processingError: text("processing_error"),
    processedAt: timestamp("processed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("cvs_embedding_idx").using(
      "hnsw",
      table.cvEmbedding.op("vector_cosine_ops")
    ),
  ]
);

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
  candidateId: text("candidate_id")
    .references(() => candidates.id, { onDelete: "cascade" })
    .notNull(),
  cvId: text("cv_id")
    .references(() => cvs.id)
    .notNull(),
  message: text("message"),
  status: text("status").default("new").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const candidatesRelations = relations(candidates, ({ many }) => ({
  cvs: many(cvs),
  applications: many(applications),
}));

export const cvsRelations = relations(cvs, ({ one, many }) => ({
  candidate: one(candidates, {
    fields: [cvs.candidateId],
    references: [candidates.id],
  }),
  file: one(file, {
    fields: [cvs.fileId],
    references: [file.id],
  }),
  applications: many(applications),
}));

export const jobsRelations = relations(jobs, ({ many }) => ({
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
  candidate: one(candidates, {
    fields: [applications.candidateId],
    references: [candidates.id],
  }),
  cv: one(cvs, {
    fields: [applications.cvId],
    references: [cvs.id],
  }),
}));
