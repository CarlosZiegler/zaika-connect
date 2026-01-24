# Job Description Editor with Markdown + AI

## Overview

New Labs page for editing job descriptions with markdown support, AI assistance, and live preview. Replaces current modal workflow once validated.

## Goals

- Markdown descriptions rendered via Streamdown
- AI tools: generate, improve, format, add sections, adjust length
- Live preview matching Job Details page styling
- Sliding chat panel for custom AI requests
- Works with real job data (load/save to DB)

## Layout

### Default (chat closed)

```
┌─────────────────────────────────────────────────────────┐
│  Header: "Job Description Editor" + Job selector        │
├──────────────────────────────┬──────────────────────────┤
│     EDITOR (60%)             │     PREVIEW (40%)        │
│                              │                          │
│  AI Action Buttons           │  Job Details replica     │
│  [Generate] [Improve]        │  (ocean theme, cards)    │
│  [Format] [Add Section]      │                          │
│  [Shorter] [Longer] [Chat]   │  Streamdown rendering    │
│                              │                          │
│  Markdown Textarea           │                          │
│                              │                          │
│  [Save Job]                  │                          │
└──────────────────────────────┴──────────────────────────┘
```

### With chat open

```
┌─────────────────────────────────────────────────────────────────┐
│  Header                                                         │
├─────────────────────┬─────────────────────┬─────────────────────┤
│   EDITOR (~45%)     │   PREVIEW (~30%)    │   CHAT (25%)        │
│                     │                     │                     │
│   (compressed)      │   (compressed)      │  Stream messages    │
│                     │                     │  PromptInput        │
└─────────────────────┴─────────────────────┴─────────────────────┘
```

Content slides left with animation when chat opens/closes.

## File Structure

```
src/
├── features/lab/job-editor/
│   ├── job-editor.page.tsx           # Main page, layout
│   ├── job-editor-form.tsx           # Textarea + form state
│   ├── job-editor-preview.tsx        # Job Details replica
│   ├── job-editor-actions.tsx        # AI action buttons
│   └── use-job-editor-ai.ts          # AI streaming hook
│
├── components/
│   └── sliding-chat-panel.tsx        # Animated chat panel
│
├── routes/(dashboard)/lab/
│   └── job-editor/
│       └── index.tsx                 # Route file
│
└── api/ai/
    └── job-description.ts            # AI endpoint
```

## Components

### job-editor.page.tsx

- Layout grid orchestration
- Chat open/close state with animation
- Job selection dropdown
- Save/reset buttons
- Unsaved changes warning

### job-editor-form.tsx

- React Hook Form for field state
- Markdown textarea for description
- Configurable for adding more fields later

### job-editor-preview.tsx

- Exact replica of Job Details page styling
- Ocean theme, cards, layout
- Uses `MessageResponse` (Streamdown) for markdown rendering
- Live updates as user types or AI streams

### job-editor-actions.tsx

- 5 action buttons + chat toggle
- Uses `render` prop pattern for compositions
- "Add Section" has dropdown submenu

Action buttons:
| Button | Behavior |
|--------|----------|
| Generate | Creates full description from job title |
| Improve | Enhances grammar, clarity, structure |
| Format MD | Converts plain text to markdown |
| Add Section | Dropdown: Requirements, Benefits, About Company, Responsibilities |
| Shorter | Condenses content |
| Longer | Expands with detail |

### sliding-chat-panel.tsx

- Fixed position, 25% width
- Slide animation (translate-x)
- Reuses chat stream logic from `/features/lab/chat/`
- Uses AI elements: `MessageResponse`, `PromptInput`, `Loader`

### use-job-editor-ai.ts

- Vercel AI SDK streaming
- Handles all action types
- Updates textarea in real-time during stream

## API Endpoint

`POST /api/ai/job-description`

```typescript
type Request = {
  action: "generate" | "improve" | "format" | "add-section" | "shorter" | "longer" | "chat"
  description?: string      // current text
  jobTitle?: string         // for generate
  sectionType?: string      // for add-section
  userMessage?: string      // for chat
}
```

Returns streaming text response.

## AI Elements Reused

| Need | Component |
|------|-----------|
| Preview markdown | `MessageResponse` |
| Chat input | `PromptInput` |
| Loading | `Loader` |
| Quick suggestions | `Suggestion` |

## Data Flow

1. User selects job from dropdown
2. Job data loads into form state
3. User edits or clicks AI action
4. AI streams response into textarea
5. Preview updates live via Streamdown
6. User saves → mutation updates DB

## Key Decisions

- **Labs staging**: Keep current modal, replace after validation
- **60/40 layout**: Editor-focused, adequate preview space
- **Exact preview**: Matches Job Details page styling
- **Configurable fields**: Start with description, architecture supports adding requirements/benefits later
- **Existing AI config**: No user-facing AI settings
- **render prop**: Use `render` instead of `asChild` for shadcn/baseui

## Route

- Path: `/dashboard/lab/job-editor`
- Protected by dashboard auth
- Listed in Labs section
