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
