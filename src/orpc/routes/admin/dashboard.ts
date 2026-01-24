import { ORPCError } from "@orpc/server";
import {
  differenceInDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import { and, avg, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";

import { isAdminEmail } from "@/lib/auth/admin-check";
import { applications, jobs } from "@/lib/db/schema";

import { orpc, protectedProcedure } from "../../orpc-server";

const adminProcedure = protectedProcedure.use(async ({ context, next }) => {
  if (!isAdminEmail(context.session?.user?.email)) {
    throw new ORPCError("FORBIDDEN", { message: "Admin access required" });
  }
  return next({ context });
});

const periodSchema = z.enum(["7d", "30d", "month", "3months"]);

function getDateRange(period: z.infer<typeof periodSchema>) {
  const now = new Date();
  let startDate: Date;
  let endDate = now;

  switch (period) {
    case "7d": {
      startDate = subDays(now, 7);
      break;
    }
    case "30d": {
      startDate = subDays(now, 30);
      break;
    }
    case "month": {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      break;
    }
    case "3months": {
      startDate = subMonths(now, 3);
      break;
    }
  }

  return { startDate, endDate };
}

function getPreviousDateRange(period: z.infer<typeof periodSchema>) {
  const { startDate, endDate } = getDateRange(period);
  const duration = differenceInDays(endDate, startDate);
  return {
    startDate: subDays(startDate, duration + 1),
    endDate: subDays(startDate, 1),
  };
}

export const adminDashboardRouter = orpc.router({
  stats: adminProcedure
    .input(z.object({ period: periodSchema.default("7d") }))
    .handler(async ({ input, context }) => {
      const { startDate, endDate } = getDateRange(input.period);
      const prev = getPreviousDateRange(input.period);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Run all queries in parallel
      const [
        totalAppsResult,
        prevAppsResult,
        newTodayResult,
        pendingResult,
        oldestPendingResult,
        activeJobsResult,
        jobsCreatedResult,
        avgScoreResult,
        topScoringJobResult,
        statusCountsResult,
        appsOverTimeResult,
        topJobsResult,
        recentAppsResult,
      ] = await Promise.all([
        // Total applications in period
        context.db
          .select({ count: count() })
          .from(applications)
          .where(
            and(
              gte(applications.createdAt, startDate),
              lte(applications.createdAt, endDate)
            )
          ),

        // Previous period applications
        context.db
          .select({ count: count() })
          .from(applications)
          .where(
            and(
              gte(applications.createdAt, prev.startDate),
              lte(applications.createdAt, prev.endDate)
            )
          ),

        // New today
        context.db
          .select({ count: count() })
          .from(applications)
          .where(gte(applications.createdAt, todayStart)),

        // Pending review (status = 'new')
        context.db
          .select({ count: count() })
          .from(applications)
          .where(eq(applications.status, "new")),

        // Oldest pending
        context.db
          .select({ createdAt: applications.createdAt })
          .from(applications)
          .where(eq(applications.status, "new"))
          .orderBy(applications.createdAt)
          .limit(1),

        // Active jobs
        context.db
          .select({ count: count() })
          .from(jobs)
          .where(eq(jobs.isActive, true)),

        // Jobs created in period
        context.db
          .select({ count: count() })
          .from(jobs)
          .where(
            and(gte(jobs.createdAt, startDate), lte(jobs.createdAt, endDate))
          ),

        // Average AI score (where not null)
        context.db
          .select({ avg: avg(applications.aiScore) })
          .from(applications)
          .where(
            and(
              gte(applications.createdAt, startDate),
              lte(applications.createdAt, endDate),
              sql`${applications.aiScore} IS NOT NULL`
            )
          ),

        // Top scoring job
        context.db
          .select({
            id: jobs.id,
            title: jobs.title,
            avgScore: avg(applications.aiScore),
          })
          .from(applications)
          .innerJoin(jobs, eq(applications.jobId, jobs.id))
          .where(
            and(
              gte(applications.createdAt, startDate),
              sql`${applications.aiScore} IS NOT NULL`
            )
          )
          .groupBy(jobs.id, jobs.title)
          .orderBy(desc(avg(applications.aiScore)))
          .limit(1),

        // Applications by status
        context.db
          .select({
            status: applications.status,
            count: count(),
          })
          .from(applications)
          .groupBy(applications.status),

        // Applications over time
        context.db
          .select({
            date: sql<string>`to_char(${applications.createdAt}, 'YYYY-MM-DD')`,
            count: count(),
          })
          .from(applications)
          .where(
            and(
              gte(applications.createdAt, startDate),
              lte(applications.createdAt, endDate)
            )
          )
          .groupBy(sql`to_char(${applications.createdAt}, 'YYYY-MM-DD')`)
          .orderBy(sql`to_char(${applications.createdAt}, 'YYYY-MM-DD')`),

        // Top jobs by applications
        context.db
          .select({
            id: jobs.id,
            title: jobs.title,
            count: count(),
            avgScore: avg(applications.aiScore),
          })
          .from(applications)
          .innerJoin(jobs, eq(applications.jobId, jobs.id))
          .where(
            and(
              gte(applications.createdAt, startDate),
              lte(applications.createdAt, endDate)
            )
          )
          .groupBy(jobs.id, jobs.title)
          .orderBy(desc(count()))
          .limit(5),

        // Recent applications
        context.db
          .select({
            id: applications.id,
            fullName: applications.fullName,
            email: applications.email,
            jobId: applications.jobId,
            jobTitle: jobs.title,
            aiScore: applications.aiScore,
            status: applications.status,
            createdAt: applications.createdAt,
          })
          .from(applications)
          .innerJoin(jobs, eq(applications.jobId, jobs.id))
          .orderBy(desc(applications.createdAt))
          .limit(10),
      ]);

      // Calculate conversion rate (past "new" status)
      const totalAll = statusCountsResult.reduce(
        (sum, s) => sum + Number(s.count),
        0
      );
      const newCount =
        statusCountsResult.find((s) => s.status === "new")?.count ?? 0;
      const conversionRate =
        totalAll > 0 ? ((totalAll - Number(newCount)) / totalAll) * 100 : 0;
      const interviewedCount =
        statusCountsResult.find((s) => s.status === "shortlisted")?.count ?? 0;
      const hiredCount =
        statusCountsResult.find((s) => s.status === "reviewed")?.count ?? 0;

      // Calculate oldest pending days
      const oldestPending = oldestPendingResult.at(0);
      const oldestPendingDays = oldestPending
        ? differenceInDays(new Date(), oldestPending.createdAt)
        : 0;

      // Fill in missing dates for chart
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const appsMap = new Map(
        appsOverTimeResult.map((r) => [r.date, Number(r.count)])
      );
      const applicationsOverTime = dateRange.map((date) => ({
        date: format(date, "yyyy-MM-dd"),
        count: appsMap.get(format(date, "yyyy-MM-dd")) ?? 0,
      }));

      // Status colors - using ocean palette
      const statusColors: Record<string, string> = {
        new: "#006466",
        reviewed: "#065a60",
        shortlisted: "#0b525b",
        rejected: "#144552",
      };

      return {
        totalApplications: Number(totalAppsResult.at(0)?.count ?? 0),
        totalApplicationsPrevious: Number(prevAppsResult.at(0)?.count ?? 0),
        newToday: Number(newTodayResult.at(0)?.count ?? 0),
        pendingReview: Number(pendingResult.at(0)?.count ?? 0),
        oldestPendingDays,
        activeJobs: Number(activeJobsResult.at(0)?.count ?? 0),
        jobsCreatedInPeriod: Number(jobsCreatedResult.at(0)?.count ?? 0),
        avgAiScore: avgScoreResult.at(0)?.avg
          ? Math.round(Number(avgScoreResult.at(0)?.avg))
          : null,
        topScoringJob: (() => {
          const topJob = topScoringJobResult.at(0);
          return topJob ? { id: topJob.id, title: topJob.title } : null;
        })(),
        conversionRate: Math.round(conversionRate),
        interviewedCount: Number(interviewedCount),
        hiredCount: Number(hiredCount),
        applicationsOverTime,
        applicationsByStatus: statusCountsResult.map((s) => ({
          status: s.status,
          count: Number(s.count),
          color: statusColors[s.status] ?? "hsl(var(--chart-5))",
        })),
        topJobsByApplications: topJobsResult.map((j) => ({
          id: j.id,
          title: j.title,
          count: Number(j.count),
          avgScore: j.avgScore ? Math.round(Number(j.avgScore)) : null,
        })),
        recentApplications: recentAppsResult.map((a) => ({
          id: a.id,
          fullName: a.fullName,
          email: a.email,
          jobId: a.jobId,
          jobTitle: a.jobTitle,
          aiScore: a.aiScore,
          status: a.status,
          createdAt: a.createdAt.toISOString(),
        })),
      };
    }),
});
