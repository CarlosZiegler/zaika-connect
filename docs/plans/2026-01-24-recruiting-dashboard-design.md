# Recruiting Dashboard Overview

## Overview

Replace the generic demo overview page with a recruiting-focused dashboard showing real business metrics from jobs and applications data.

## Goals

- Real-time recruiting metrics for recruiters, hiring managers, and admins
- Selectable time periods (7d, 30d, month, 3 months)
- Visual trends with charts
- Quick access to recent applications
- Uses existing shadcn components and date utilities

## Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Recruiting Overview                    [←] [January 2026] [→]  │
│  Track applications, jobs, and hiring     [Last 7 days ▼]      │
├────────┬────────┬────────┬────────┬────────┬────────────────┤
│ Total  │  New   │ Active │  Avg   │ Conv.  │   Pending      │
│ Apps   │ Today  │  Jobs  │ Score  │  Rate  │   Review       │
├─────────────────────────────────┬────────────────────────────┤
│  Applications Over Time (60%)   │  Apps by Status (40%)      │
├─────────────────────────────────┴────────────────────────────┤
│  Top Jobs by Applications (full width)                        │
├──────────────────────────────────────────────────────────────┤
│  Recent Applications Table                          [View All]│
└──────────────────────────────────────────────────────────────┘
```

## Components

### Period Selector

- shadcn `Select` with options: Last 7 days, Last 30 days, This month, Last 3 months
- Optional: Month navigation arrows like financial dashboard
- Updates all metrics when changed

### KPI Cards (6 cards)

| Card               | Metric                | Subtext                  | Icon       |
| ------------------ | --------------------- | ------------------------ | ---------- |
| Total Applications | Count in period       | "+X% vs last period"     | FileText   |
| New Today          | Today's applications  | "X pending review"       | Inbox      |
| Active Jobs        | Open positions        | "X created this period"  | Briefcase  |
| Avg AI Score       | Average score (0-100) | "Top: [job name]"        | Brain      |
| Conversion Rate    | % past "new" status   | "X interviewed, Y hired" | TrendingUp |
| Pending Review     | "new" status count    | "Oldest: X days ago"     | Clock      |

Each card shows:

- Large primary number
- Trend indicator (% change with colored arrow)
- Contextual subtext
- Icon with semantic color

### Charts

**Applications Over Time (Area Chart - 60% width)**

- X-axis: Days/weeks based on period
- Y-axis: Application count
- Toggle: Area / Line / Bar
- Uses existing `ChartConfig` pattern with Recharts

**Applications by Status (Donut Chart - 40% width)**

- Segments: New, Reviewing, Interviewed, Hired, Rejected
- Color-coded by status
- Shows current pipeline distribution
- Click segment to filter (future enhancement)

**Top Jobs by Applications (Horizontal Bar - full width)**

- Top 5 jobs ranked by application count
- Shows job title + count
- Bar color indicates avg AI score quality
- Click navigates to job detail

### Recent Applications Table

| Column    | Content                                              |
| --------- | ---------------------------------------------------- |
| Candidate | Name + email (smaller text)                          |
| Job       | Job title (link)                                     |
| AI Score  | Color-coded badge (green >70, yellow 50-70, red <50) |
| Status    | Status badge                                         |
| Applied   | Relative time via `formatRelativeTime`               |
| Actions   | Dropdown: View CV, Review, Reject                    |

Features:

- Last 10 applications (no pagination)
- "View All" links to `/admin/applications`
- Row click opens detail
- Sortable by score/date

## API

### New ORPC Endpoint: `orpc.admin.dashboard.stats`

**Input:**

```typescript
{
  period: "7d" | "30d" | "month" | "3months"
  startDate?: string  // for custom range
  endDate?: string
}
```

**Output:**

```typescript
{
  // KPI metrics
  totalApplications: number
  totalApplicationsPrevious: number
  newToday: number
  pendingReview: number
  oldestPendingDays: number
  activeJobs: number
  jobsCreatedInPeriod: number
  avgAiScore: number | null
  topScoringJob: { id: string; title: string } | null
  conversionRate: number
  interviewedCount: number
  hiredCount: number

  // Chart data
  applicationsOverTime: Array<{ date: string; count: number }>
  applicationsByStatus: Array<{ status: string; count: number; color: string }>
  topJobsByApplications: Array<{
    id: string
    title: string
    count: number
    avgScore: number | null
  }>

  // Recent activity
  recentApplications: Array<{
    id: string
    fullName: string
    email: string
    jobId: string
    jobTitle: string
    aiScore: number | null
    status: string
    createdAt: string
  }>
}
```

## File Structure

```
src/
├── routes/(dashboard)/overview/
│   └── index.tsx                    # Main page (rewrite)
├── features/dashboard/
│   ├── dashboard.page.tsx           # Page component
│   ├── dashboard-kpi-cards.tsx      # KPI cards grid
│   ├── dashboard-charts.tsx         # Charts section
│   ├── dashboard-recent-table.tsx   # Recent applications table
│   ├── dashboard-period-select.tsx  # Period selector
│   └── index.ts                     # Exports
└── orpc/routes/
    └── admin.ts                     # Add dashboard.stats endpoint
```

## Utilities Used

- `src/lib/format-date.ts`: `formatRelativeTime`, `formatDateShort`
- `date-fns`: `subDays`, `startOfMonth`, `endOfMonth`, `eachDayOfInterval`
- Drizzle: `count`, `avg`, `gte`, `lte`, `desc` for aggregations

## Implementation Notes

- All aggregations server-side for performance
- Use `useQuery` with `keepPreviousData` for smooth period switching
- Period stored in URL search params for shareability
- Charts use existing Recharts + shadcn chart config pattern
- Admin-only page (existing auth guard)
