# Public Pages Redesign - Ocean/Depth Theme

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform all public pages (landing, jobs, apply, cv-review) to use new ocean/depth color palette with reusable header/footer components

**Architecture:** Reusable PublicLayout component wraps all public pages. New color palette defined in CSS. Dashboard and auth pages unchanged.

**Tech Stack:** TailwindCSS v4, React, TanStack Router, i18next

---

## Color Palette

Ocean (teal/blue-green):

- ocean-1: #006466 (primary teal)
- ocean-2: #065A60
- ocean-3: #0B525B (accent)
- ocean-4: #144552
- ocean-5: #1B3A4B (deep blue - hero backgrounds)

Depth (purple/violet):

- depth-1: #212F45 (midnight - footer)
- depth-2: #272640
- depth-3: #312244 (CTA sections)
- depth-4: #3E1F47
- depth-5: #4D194D (secondary purple)

---

## Task 0: Add Color System to CSS

**Files:**

- Modify: `src/app.css`

**Step 1:** Add ocean/depth colors to @theme inline block

```css
/* Ocean palette */
--color-ocean-1: #006466;
--color-ocean-2: #065a60;
--color-ocean-3: #0b525b;
--color-ocean-4: #144552;
--color-ocean-5: #1b3a4b;

/* Depth palette */
--color-depth-1: #212f45;
--color-depth-2: #272640;
--color-depth-3: #312244;
--color-depth-4: #3e1f47;
--color-depth-5: #4d194d;
```

**Step 2:** Add glass-panel utility to @layer utilities

```css
.glass-panel {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dark .glass-panel {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
```

**Step 3:** Commit

```bash
git add src/app.css
git commit -m "feat: add ocean/depth color palette and glass-panel utility"
```

---

## Task 1: Create Public Header Component

**Files:**

- Create: `src/components/public/public-header.tsx`

**Requirements:**

- Fixed position, z-50
- Glass-panel styling (blur backdrop)
- Logo on left (use existing Logo component or text)
- Nav links: Find Jobs (/jobs), CV Review (/cv-review)
- Right side: Log in link, Sign Up button (teal)
- Mobile responsive with hamburger menu
- Use i18n keys for all text

**Step 1:** Create the component with desktop nav
**Step 2:** Add mobile menu with hamburger toggle
**Step 3:** Commit

---

## Task 2: Create Public Footer Component

**Files:**

- Create: `src/components/public/public-footer.tsx`

**Requirements:**

- Dark background (depth-1)
- 4-column grid on desktop, stacked on mobile
- Column 1: Logo + tagline
- Column 2: "For Job Seekers" links
- Column 3: "Resources" links
- Column 4: Newsletter signup (visual only for now)
- Bottom bar: Copyright, Privacy, Terms links
- Use i18n keys

**Step 1:** Create the component
**Step 2:** Commit

---

## Task 3: Create Public Layout Wrapper

**Files:**

- Create: `src/components/public/public-layout.tsx`

**Requirements:**

- Accepts children
- Renders PublicHeader at top
- Renders children in main
- Renders PublicFooter at bottom
- Handles pt-16 padding for fixed header

**Step 1:** Create the wrapper component
**Step 2:** Commit

---

## Task 4: Create Search Hero Component

**Files:**

- Create: `src/components/public/search-hero.tsx`

**Requirements:**

- Dual input search bar (keywords + location)
- "Find Jobs" button
- On submit, navigates to /jobs with query params (?q=keyword&location=location)
- Trust badges below (hardcoded stats)
- Can be used on landing and jobs page

**Step 1:** Create the component
**Step 2:** Commit

---

## Task 5: Create Stats Section Component

**Files:**

- Create: `src/components/public/stats-section.tsx`

**Requirements:**

- 4-column grid (2 cols on mobile)
- Hardcoded impressive numbers with labels
- Hover scale animation on numbers
- Ocean-1 color for numbers

**Step 1:** Create the component
**Step 2:** Commit

---

## Task 6: Add Public Pages i18n Keys

**Files:**

- Modify: `src/lib/intl/locales/en.ts`
- Modify: `src/lib/intl/locales/de.ts`
- Modify: `src/lib/intl/locales/pt.ts`

**New Keys:**

```
PUBLIC_NAV_FIND_JOBS, PUBLIC_NAV_CV_REVIEW, PUBLIC_NAV_LOGIN, PUBLIC_NAV_SIGNUP
PUBLIC_FOOTER_TAGLINE, PUBLIC_FOOTER_JOB_SEEKERS, PUBLIC_FOOTER_RESOURCES
PUBLIC_FOOTER_NEWSLETTER_TITLE, PUBLIC_FOOTER_NEWSLETTER_PLACEHOLDER
PUBLIC_FOOTER_PRIVACY, PUBLIC_FOOTER_TERMS, PUBLIC_FOOTER_COPYRIGHT

LANDING_HERO_TITLE, LANDING_HERO_SUBTITLE, LANDING_HERO_DESC
LANDING_SEARCH_KEYWORDS_PLACEHOLDER, LANDING_SEARCH_LOCATION_PLACEHOLDER
LANDING_SEARCH_BUTTON, LANDING_TRUST_ACCURACY, LANDING_TRUST_NETWORK, LANDING_TRUST_VERIFIED
LANDING_STATS_OPPORTUNITIES, LANDING_STATS_PARTNERSHIPS, LANDING_STATS_PROFILES, LANDING_STATS_RETENTION
LANDING_FEATURED_TITLE, LANDING_FEATURED_SUBTITLE, LANDING_VIEW_ALL
LANDING_CV_TITLE, LANDING_CV_DESC, LANDING_CV_CTA, LANDING_CV_EXPLORE
LANDING_ENTERPRISE_LABEL, LANDING_ENTERPRISE_TITLE, LANDING_ENTERPRISE_DESC
LANDING_ENTERPRISE_FEATURE_1_TITLE, LANDING_ENTERPRISE_FEATURE_1_DESC
LANDING_ENTERPRISE_FEATURE_2_TITLE, LANDING_ENTERPRISE_FEATURE_2_DESC
LANDING_ENTERPRISE_CTA
```

**Step 1:** Add all keys to en.ts
**Step 2:** Add translations to de.ts
**Step 3:** Add translations to pt.ts
**Step 4:** Commit

---

## Task 7: Redesign Landing Page

**Files:**

- Modify: `src/routes/index.tsx`

**Sections:**

1. Hero with SearchHero component, ocean-5 background, animated grid SVG
2. StatsSection component
3. Featured Jobs section (reuse existing job query, new card design)
4. CV Upload CTA section (depth-3 background, glass panel)
5. Enterprise section (image left, content right)

**Step 1:** Wrap with PublicLayout
**Step 2:** Implement Hero section
**Step 3:** Add Stats section
**Step 4:** Update Featured Jobs section with new card design
**Step 5:** Add CV CTA section
**Step 6:** Add Enterprise section
**Step 7:** Remove old navigation/footer code
**Step 8:** Commit

---

## Task 8: Redesign Jobs List Page

**Files:**

- Modify: `src/routes/jobs/index.tsx`

**Changes:**

- Wrap with PublicLayout
- Add smaller hero with SearchHero (reads from URL params)
- Update job cards to new design with colored left borders
- Filter bar with ocean accent
- Use useDebouncedSearchParam for URL search

**Step 1:** Update route to accept search params (q, location, type, industry)
**Step 2:** Wrap with PublicLayout
**Step 3:** Add hero section with SearchHero
**Step 4:** Update filter bar styling
**Step 5:** Update JobCard design with colored border
**Step 6:** Remove old header/footer code
**Step 7:** Commit

---

## Task 9: Update Job Detail Page

**Files:**

- Modify: `src/routes/jobs/$slug.tsx`
- Modify: `src/features/jobs/job-detail.tsx`

**Changes:**

- Wrap with PublicLayout
- Hero section with ocean-4 background, job title
- Update card styling with ocean accents
- Keep chat widget

**Step 1:** Wrap with PublicLayout
**Step 2:** Add hero section
**Step 3:** Update styling
**Step 4:** Commit

---

## Task 10: Update Apply Page

**Files:**

- Modify: `src/routes/apply/$jobSlug.tsx`

**Changes:**

- Wrap with PublicLayout
- Update form styling with ocean accents
- Cleaner layout

**Step 1:** Wrap with PublicLayout
**Step 2:** Update form styling
**Step 3:** Commit

---

## Task 11: Update CV Review Page

**Files:**

- Modify: `src/routes/cv-review.tsx`

**Changes:**

- Wrap with PublicLayout
- Hero section explaining the tool
- Update upload area styling
- Update results cards styling

**Step 1:** Wrap with PublicLayout
**Step 2:** Add hero section
**Step 3:** Update component styling
**Step 4:** Commit

---

## Execution Notes

- Keep Lucide icons (no Material Symbols)
- Keep existing Inter font (no Playfair Display)
- Dashboard and auth pages remain unchanged
- Use hardcoded stats for now
- Search hero navigates to /jobs with query params
