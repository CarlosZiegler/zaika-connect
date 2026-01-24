# Job Detail Page with Applications Kanban

## Overview

New job detail page with tabbed layout showing job info/stats and applications in table or kanban view. Kanban enables drag-drop status changes.

## Goals

- Clickable job titles in admin list → detail page
- Tabbed layout: Overview (job info + stats) and Applications (table/kanban)
- Kanban board with columns: New → Reviewed → Shortlisted → Rejected
- Drag cards between columns to update status
- Context menu on cards: View, Download CV, Copy Email, Quick Reject

## Route

`/dashboard/admin/jobs/$jobId`

## Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Header: [← Back] Job Title              [Edit Job Button]  │
├─────────────────────────────────────────────────────────────┤
│  Tabs: [ Overview ]  [ Applications (count) ]               │
├─────────────────────────────────────────────────────────────┤
│  Tab Content Area                                           │
└─────────────────────────────────────────────────────────────┘
```

## Overview Tab

**Stats row (clickable, switches to Applications tab filtered):**
- Total applications
- New (blue)
- Reviewed (purple)
- Shortlisted (green)
- Rejected (red)
- Avg AI Score

**Job details:**
- Description rendered with Streamdown (markdown)
- Quick Info card: Location, Type, Industry, Salary, Status, Created date
- Requirements card (if exists)
- Benefits card (if exists)

## Applications Tab

**View toggle:** Segmented control [Table | Kanban]
- Default: Table view
- No persistence (always starts with Table)

### Table View

Reuse existing applications table filtered by jobId:
- Columns: Candidate, Email, AI Score, Status, Date, Actions
- Inline status dropdown

### Kanban View

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│    NEW       │   REVIEWED   │  SHORTLISTED │   REJECTED   │
│    (3)       │     (2)      │     (1)      │     (0)      │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │              │
│ │ Name     │ │ │ Name     │ │ │ Name     │ │              │
│ │ email    │ │ │ email    │ │ │ email    │ │              │
│ │ date     │ │ │ date     │ │ │ date     │ │              │
│ │ [score]  │ │ │ [score]  │ │ │ [score]  │ │              │
│ └──────────┘ │ └──────────┘ │ └──────────┘ │              │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

**Card content:**
- Candidate name (bold)
- Email (truncated)
- Applied date
- AI Score badge (green ≥70, yellow ≥50, red <50)

**Drag behavior:**
- Drag to column → updateStatus mutation
- Optimistic update, revert on error
- Toast on status change

**Context menu (right-click):**
- View Details → `/admin/applications/$id`
- Download CV → signed URL download
- Copy Email → clipboard + toast
- Quick Reject → move to Rejected

## Jobs List Modifications

**Title column:** Clickable link to detail page

**Actions dropdown:**
- View Details (new)
- Edit
- Delete

**New column:** Apps count per job

## File Structure

**Create:**
```
src/routes/(dashboard)/admin/jobs/$jobId.tsx
src/features/admin/job-detail/
├── job-detail.page.tsx
├── job-detail-overview.tsx
├── job-detail-applications.tsx
├── job-detail-stats.tsx
├── application-kanban.tsx
├── application-kanban-card.tsx
└── application-card-menu.tsx
```

**Modify:**
- `src/routes/(dashboard)/admin/jobs/index.tsx` - title link, View action, Apps column
- `src/orpc/routes/admin/jobs.ts` - getWithStats endpoint, list with counts

## API Changes

**New endpoint - getWithStats:**
```typescript
getWithStats: adminProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    // Returns job + stats by status + avg AI score
  })
```

**Modify list endpoint:**
```typescript
list: // Add applicationCount via LEFT JOIN + COUNT
```

## Reused Components

- `Kanban*` from `/components/ui/kanban.tsx`
- `DataGridEnhanced` for table view
- `MessageResponse` for markdown
- `AIScoreBadge` for scores
- `JobFormDialog` for edit modal
- `Tabs` components

## Data Flow

1. Page loads → fetch job + stats + applications
2. Table view: inline status select → updateStatus
3. Kanban view: drag card → optimistic update → updateStatus → revert on error
4. Context menu actions trigger respective operations
5. Stats cards clickable → switch to Applications tab with filter

## Key Decisions

- Tabbed layout for clean separation
- Segmented control for view toggle
- No view persistence (always Table default)
- Standard cards (name, email, date, score)
- Context menu for quick actions
- Apps count column in jobs list
- Three actions in dropdown (View, Edit, Delete)
