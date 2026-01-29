import type { PgDatabase } from "drizzle-orm/pg-core";

// src/lib/search/jobs-search.ts
import { and, desc, eq, sql } from "drizzle-orm";

import { jobs } from "@/lib/db/schema";

type SearchParams = {
  query?: string;
  location?: string;
  employmentType?: string;
  industry?: string;
  limit?: number;
  offset?: number;
};

export async function searchJobs(
  db: PgDatabase<any, any, any>,
  params: SearchParams
) {
  const {
    query,
    location,
    employmentType,
    industry,
    limit = 20,
    offset = 0,
  } = params;

  const conditions = [eq(jobs.isActive, true)];

  if (location) {
    conditions.push(eq(jobs.location, location));
  }
  if (employmentType) {
    conditions.push(eq(jobs.employmentType, employmentType));
  }
  if (industry) {
    conditions.push(eq(jobs.industry, industry));
  }

  // Use BM25 full-text search with fuzzy matching if query provided
  if (query) {
    // Sanitize query and build fuzzy search across title and description
    const sanitizedQuery = query.trim().replace(/'/g, "''");
    const fuzzyQuery = `paradedb.boolean(should => ARRAY[
      paradedb.match('title', '${sanitizedQuery}', distance => 1),
      paradedb.match('description', '${sanitizedQuery}', distance => 1)
    ])`;

    const searchResults = await db.execute(sql.raw(`
      SELECT
        j.id,
        j.slug,
        j.title,
        j.description,
        j.requirements,
        j.benefits,
        j.location,
        j.employment_type as "employmentType",
        j.industry,
        j.salary_min as "salaryMin",
        j.salary_max as "salaryMax",
        j.is_active as "isActive",
        j.created_at as "createdAt",
        j.updated_at as "updatedAt",
        paradedb.score(j.id) as rank
      FROM jobs j
      WHERE j.is_active = true
        ${location ? `AND j.location = '${location.replace(/'/g, "''")}'` : ""}
        ${employmentType ? `AND j.employment_type = '${employmentType.replace(/'/g, "''")}'` : ""}
        ${industry ? `AND j.industry = '${industry.replace(/'/g, "''")}'` : ""}
        AND j.id @@@ ${fuzzyQuery}
      ORDER BY rank DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `));

    const countResult = await db.execute(sql.raw(`
      SELECT count(*) as count
      FROM jobs j
      WHERE j.is_active = true
        ${location ? `AND j.location = '${location.replace(/'/g, "''")}'` : ""}
        ${employmentType ? `AND j.employment_type = '${employmentType.replace(/'/g, "''")}'` : ""}
        ${industry ? `AND j.industry = '${industry.replace(/'/g, "''")}'` : ""}
        AND j.id @@@ ${fuzzyQuery}
    `));

    const total = Number(countResult.at(0)?.count ?? 0);

    return {
      jobs: searchResults as (typeof jobs.$inferSelect)[],
      total,
      hasMore: offset + searchResults.length < total,
    };
  }

  // No query - use regular filtering
  const [jobsList, countResult] = await Promise.all([
    db
      .select()
      .from(jobs)
      .where(and(...conditions))
      .orderBy(desc(jobs.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(and(...conditions)),
  ]);

  const total = Number(countResult.at(0)?.count ?? 0);

  return {
    jobs: jobsList,
    total,
    hasMore: offset + jobsList.length < total,
  };
}
