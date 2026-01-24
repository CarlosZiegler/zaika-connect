# Job Description Editor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a Labs page for editing job descriptions with markdown support, AI assistance, and live preview.

**Architecture:** Split-pane layout (60/40) with React Hook Form, Streamdown for preview, sliding chat panel. Reuses existing AI elements and chat patterns.

**Tech Stack:** React 19, TanStack Router, React Hook Form, Zod, Streamdown, Vercel AI SDK (@tanstack/ai), ORPC for data mutations.

---

## Task 1: Create Route File

**Files:**

- Create: `src/routes/(dashboard)/lab/job-editor/index.tsx`

**Step 1: Create the route file**

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";

import { JobEditorPage } from "@/features/lab/job-editor/job-editor.page";
import { getUserWithAdmin } from "@/lib/auth/auth-server-fn";

export const Route = createFileRoute("/(dashboard)/lab/job-editor/")({
  component: RouteComponent,
  beforeLoad: async () => {
    const { session, isAdmin } = await getUserWithAdmin();
    if (!isAdmin) {
      throw redirect({ to: "/overview" });
    }
    return { session };
  },
});

function RouteComponent() {
  return <JobEditorPage />;
}
```

**Step 2: Verify route created**

Run: `ls src/routes/\(dashboard\)/lab/job-editor/`
Expected: `index.tsx`

**Step 3: Commit**

```bash
git add src/routes/\(dashboard\)/lab/job-editor/index.tsx
git commit -m "feat(job-editor): add route file"
```

---

## Task 2: Create Job Editor Page Layout

**Files:**

- Create: `src/features/lab/job-editor/job-editor.page.tsx`

**Step 1: Create the main page component**

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { FileTextIcon, RotateCcwIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { orpc } from "@/orpc/orpc-client";

import { JobEditorActions } from "./job-editor-actions";
import { JobEditorForm } from "./job-editor-form";
import { JobEditorPreview } from "./job-editor-preview";
import { SlidingChatPanel } from "./sliding-chat-panel";

export function JobEditorPage() {
  const { t } = useTranslation();
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [initialDescription, setInitialDescription] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Fetch jobs list
  const { data, isLoading: isLoadingJobs } = useQuery(
    orpc.admin.jobs.list.queryOptions()
  );
  const jobs = data?.jobs ?? [];

  // Load selected job
  const selectedJob = jobs.find((job) => job.id === selectedJobId);

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      setDescription(job.description);
      setInitialDescription(job.description);
    }
  };

  const handleReset = () => {
    setDescription(initialDescription);
  };

  const hasChanges = description !== initialDescription;

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="flex items-center gap-2 font-semibold text-xl">
            <FileTextIcon className="size-5" />
            Job Description Editor
          </h1>
          <Select value={selectedJobId} onValueChange={handleJobSelect}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a job to edit..." />
            </SelectTrigger>
            <SelectContent>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges}
          >
            <RotateCcwIcon className="mr-2 size-4" />
            Reset
          </Button>
          <Button disabled={!hasChanges || !selectedJobId}>Save Job</Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex min-h-0 flex-1">
        {/* Main Content - slides when chat opens */}
        <div
          className={cn(
            "flex min-h-0 flex-1 transition-all duration-300 ease-in-out",
            chatOpen ? "w-3/4" : "w-full"
          )}
        >
          {isLoadingJobs ? (
            <div className="flex flex-1 items-center justify-center">
              <Spinner className="size-8" />
            </div>
          ) : !selectedJobId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground">
              <FileTextIcon className="size-12" />
              <p>Select a job to start editing</p>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1">
              {/* Editor Panel - 60% */}
              <div className="flex w-3/5 flex-col border-r p-6">
                <JobEditorActions
                  description={description}
                  jobTitle={selectedJob?.title ?? ""}
                  onDescriptionChange={setDescription}
                  onChatToggle={() => setChatOpen(!chatOpen)}
                  chatOpen={chatOpen}
                  isStreaming={isStreaming}
                  setIsStreaming={setIsStreaming}
                />
                <JobEditorForm
                  description={description}
                  onDescriptionChange={setDescription}
                  disabled={isStreaming}
                />
              </div>

              {/* Preview Panel - 40% */}
              <div className="w-2/5 overflow-y-auto bg-slate-50 p-6">
                <JobEditorPreview description={description} job={selectedJob} />
              </div>
            </div>
          )}
        </div>

        {/* Sliding Chat Panel - 25% */}
        <SlidingChatPanel
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          description={description}
          jobTitle={selectedJob?.title ?? ""}
          onDescriptionChange={setDescription}
        />
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/features/lab/job-editor/job-editor.page.tsx
git commit -m "feat(job-editor): add main page layout"
```

---

## Task 3: Create Job Editor Form Component

**Files:**

- Create: `src/features/lab/job-editor/job-editor-form.tsx`

**Step 1: Create the form component**

```tsx
"use client";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type JobEditorFormProps = {
  description: string;
  onDescriptionChange: (value: string) => void;
  disabled?: boolean;
};

export function JobEditorForm({
  description,
  onDescriptionChange,
  disabled = false,
}: JobEditorFormProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <label htmlFor="job-description" className="font-medium text-sm">
        Description (Markdown)
      </label>
      <Textarea
        id="job-description"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Write your job description using markdown..."
        className={cn(
          "min-h-0 flex-1 resize-none font-mono text-sm",
          disabled && "opacity-50"
        )}
        disabled={disabled}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/features/lab/job-editor/job-editor-form.tsx
git commit -m "feat(job-editor): add form component"
```

---

## Task 4: Create Job Editor Preview Component

**Files:**

- Create: `src/features/lab/job-editor/job-editor-preview.tsx`

**Step 1: Create the preview component**

```tsx
"use client";

import { SparklesIcon } from "lucide-react";

import { MessageResponse } from "@/components/ai-elements/message";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Job = {
  id: string;
  title: string;
  description: string;
  location: string;
  employmentType: string;
  industry: string;
};

type JobEditorPreviewProps = {
  description: string;
  job?: Job | null;
};

export function JobEditorPreview({ description, job }: JobEditorPreviewProps) {
  if (!job) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="text-muted-foreground text-sm">
        Preview: How users will see this on the Job Details page
      </div>

      {/* About Section - mirrors job-detail.tsx */}
      <Card className="overflow-hidden border-slate-100 bg-white shadow-md">
        <div className="h-1 bg-ocean-1" />
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl text-depth-1">
            <div className="flex size-8 items-center justify-center rounded-lg bg-ocean-1/10 text-ocean-1">
              <SparklesIcon className="size-4" aria-hidden="true" />
            </div>
            About This Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none text-slate-600">
            <MessageResponse>{description}</MessageResponse>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/features/lab/job-editor/job-editor-preview.tsx
git commit -m "feat(job-editor): add preview component with Streamdown"
```

---

## Task 5: Create AI Actions Component

**Files:**

- Create: `src/features/lab/job-editor/job-editor-actions.tsx`

**Step 1: Create the actions component**

```tsx
"use client";

import {
  FileTextIcon,
  MaximizeIcon,
  MessageSquareIcon,
  MinimizeIcon,
  PlusIcon,
  SparklesIcon,
  WandIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { useJobEditorAI } from "./use-job-editor-ai";

type JobEditorActionsProps = {
  description: string;
  jobTitle: string;
  onDescriptionChange: (value: string) => void;
  onChatToggle: () => void;
  chatOpen: boolean;
  isStreaming: boolean;
  setIsStreaming: (value: boolean) => void;
};

export function JobEditorActions({
  description,
  jobTitle,
  onDescriptionChange,
  onChatToggle,
  chatOpen,
  isStreaming,
  setIsStreaming,
}: JobEditorActionsProps) {
  const { runAction } = useJobEditorAI({
    description,
    jobTitle,
    onDescriptionChange,
    setIsStreaming,
  });

  const hasDescription = description.trim().length > 0;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => runAction("generate")}
        disabled={isStreaming || !jobTitle}
      >
        <SparklesIcon className="mr-2 size-4" />
        Generate
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => runAction("improve")}
        disabled={isStreaming || !hasDescription}
      >
        <WandIcon className="mr-2 size-4" />
        Improve
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => runAction("format")}
        disabled={isStreaming || !hasDescription}
      >
        <FileTextIcon className="mr-2 size-4" />
        Format MD
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              disabled={isStreaming || !hasDescription}
            />
          }
        >
          <PlusIcon className="mr-2 size-4" />
          Add Section
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onSelect={() => runAction("add-section", "requirements")}
          >
            Requirements
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => runAction("add-section", "benefits")}
          >
            Benefits
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => runAction("add-section", "about-company")}
          >
            About Company
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => runAction("add-section", "responsibilities")}
          >
            Responsibilities
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="sm"
        onClick={() => runAction("shorter")}
        disabled={isStreaming || !hasDescription}
      >
        <MinimizeIcon className="mr-2 size-4" />
        Shorter
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => runAction("longer")}
        disabled={isStreaming || !hasDescription}
      >
        <MaximizeIcon className="mr-2 size-4" />
        Longer
      </Button>

      <div className="flex-1" />

      <Button
        variant={chatOpen ? "default" : "secondary"}
        size="sm"
        onClick={onChatToggle}
      >
        <MessageSquareIcon
          className={cn("mr-2 size-4", chatOpen && "text-primary-foreground")}
        />
        Chat
      </Button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/features/lab/job-editor/job-editor-actions.tsx
git commit -m "feat(job-editor): add AI action buttons"
```

---

## Task 6: Create AI Hook

**Files:**

- Create: `src/features/lab/job-editor/use-job-editor-ai.ts`

**Step 1: Create the AI hook**

```tsx
"use client";

import { useCallback } from "react";

type AIAction =
  | "generate"
  | "improve"
  | "format"
  | "add-section"
  | "shorter"
  | "longer";

type UseJobEditorAIProps = {
  description: string;
  jobTitle: string;
  onDescriptionChange: (value: string) => void;
  setIsStreaming: (value: boolean) => void;
};

export function useJobEditorAI({
  description,
  jobTitle,
  onDescriptionChange,
  setIsStreaming,
}: UseJobEditorAIProps) {
  const runAction = useCallback(
    async (action: AIAction, sectionType?: string) => {
      setIsStreaming(true);

      try {
        const response = await fetch("/api/ai/job-description", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            description,
            jobTitle,
            sectionType,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let result = action === "generate" ? "" : description;

        // For actions that append, start fresh or append
        if (action === "add-section") {
          result = description + "\n\n";
        } else if (action !== "generate") {
          result = "";
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  if (action === "add-section") {
                    result += parsed.content;
                  } else {
                    result += parsed.content;
                  }
                  onDescriptionChange(result);
                }
              } catch {
                // Ignore parse errors for partial JSON
              }
            }
          }
        }
      } catch (error) {
        console.error("AI action failed:", error);
      } finally {
        setIsStreaming(false);
      }
    },
    [description, jobTitle, onDescriptionChange, setIsStreaming]
  );

  return { runAction };
}
```

**Step 2: Commit**

```bash
git add src/features/lab/job-editor/use-job-editor-ai.ts
git commit -m "feat(job-editor): add AI streaming hook"
```

---

## Task 7: Create Sliding Chat Panel

**Files:**

- Create: `src/features/lab/job-editor/sliding-chat-panel.tsx`

**Step 1: Create the sliding chat panel**

```tsx
"use client";

import { XIcon } from "lucide-react";
import { useState } from "react";

import { Loader } from "@/components/ai-elements/loader";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type SlidingChatPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  description: string;
  jobTitle: string;
  onDescriptionChange: (value: string) => void;
};

export function SlidingChatPanel({
  isOpen,
  onClose,
  description,
  jobTitle,
  onDescriptionChange,
}: SlidingChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSubmit = async (message: PromptInputMessage) => {
    if (!message.text?.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message.text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setText("");
    setIsStreaming(true);

    try {
      const response = await fetch("/api/ai/job-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          description,
          jobTitle,
          userMessage: message.text,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantId = crypto.randomUUID();

      // Add empty assistant message
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantContent += parsed.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: assistantContent }
                      : m
                  )
                );
              }
              // Check if AI wants to update description
              if (parsed.updatedDescription) {
                onDescriptionChange(parsed.updatedDescription);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat failed:", error);
    } finally {
      setIsStreaming(false);
    }
  };

  const status = isStreaming ? "streaming" : "ready";

  return (
    <div
      className={cn(
        "fixed right-0 top-0 z-50 flex h-full w-1/4 flex-col border-l bg-background",
        "transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <span className="font-medium">AI Assistant</span>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-muted-foreground text-sm">
            <p>
              Ask me to help with the job description.
              <br />
              E.g., "Make it more professional" or "Add remote work benefits"
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <Message key={msg.id} from={msg.role}>
                <MessageContent>
                  <MessageResponse>{msg.content}</MessageResponse>
                </MessageContent>
              </Message>
            ))}
            {isStreaming && messages.at(-1)?.role === "user" && (
              <Loader className="self-start" />
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t p-4">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea
              disabled={isStreaming}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask about this description..."
              value={text}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools />
            <PromptInputSubmit
              disabled={!text.trim() || isStreaming}
              status={status}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/features/lab/job-editor/sliding-chat-panel.tsx
git commit -m "feat(job-editor): add sliding chat panel"
```

---

## Task 8: Create AI API Endpoint

**Files:**

- Create: `src/routes/api/ai/job-description.ts`

**Step 1: Create the API endpoint**

```tsx
import { chat, toServerSentEventsStream } from "@tanstack/ai";
import { openaiText } from "@tanstack/ai-openai";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ai/job-description")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const { action, description, jobTitle, sectionType, userMessage } =
            body;

          const systemPrompt = getSystemPrompt(action, sectionType);
          const userPrompt = getUserPrompt(
            action,
            description,
            jobTitle,
            sectionType,
            userMessage
          );

          const abortController = new AbortController();

          const baseStream = chat({
            adapter: openaiText("gpt-4o-mini"),
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          });

          const sseStream = toServerSentEventsStream(
            baseStream,
            abortController
          );

          return new Response(sseStream, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          });
        } catch (error: unknown) {
          console.error(error);
          const message =
            error instanceof Error ? error.message : "An error occurred";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});

function getSystemPrompt(action: string, sectionType?: string): string {
  const basePrompt = `You are a professional job description writer. Write in markdown format with proper headings, bullet points, and formatting. Be concise but comprehensive.`;

  switch (action) {
    case "generate":
      return `${basePrompt} Generate a complete, professional job description based on the job title provided. Include sections for role overview, responsibilities, and what makes this role exciting.`;

    case "improve":
      return `${basePrompt} Improve the provided job description. Fix grammar, enhance clarity, improve structure, and make it more engaging while keeping the core content.`;

    case "format":
      return `${basePrompt} Convert the provided text into well-formatted markdown. Add appropriate headings, bullet points, and structure without changing the content meaning.`;

    case "add-section":
      return `${basePrompt} Add a new "${sectionType}" section to the job description. Write only the new section content, starting with a markdown heading.`;

    case "shorter":
      return `${basePrompt} Condense the job description while keeping all key information. Remove redundancy and make it more concise.`;

    case "longer":
      return `${basePrompt} Expand the job description with more detail. Add relevant information that would help candidates understand the role better.`;

    case "chat":
      return `${basePrompt} You are helping edit a job description. Respond to the user's request and provide the improved text. If they ask for changes, provide the full updated description.`;

    default:
      return basePrompt;
  }
}

function getUserPrompt(
  action: string,
  description: string,
  jobTitle: string,
  sectionType?: string,
  userMessage?: string
): string {
  switch (action) {
    case "generate":
      return `Generate a job description for: ${jobTitle}`;

    case "improve":
    case "format":
    case "shorter":
    case "longer":
      return `Job Description:\n\n${description}`;

    case "add-section":
      return `Current Job Description:\n\n${description}\n\nAdd a "${sectionType}" section.`;

    case "chat":
      return `Current Job Description:\n\n${description}\n\nUser request: ${userMessage}`;

    default:
      return description;
  }
}
```

**Step 2: Commit**

```bash
git add src/routes/api/ai/job-description.ts
git commit -m "feat(job-editor): add AI API endpoint"
```

---

## Task 9: Add Save Functionality

**Files:**

- Modify: `src/features/lab/job-editor/job-editor.page.tsx`

**Step 1: Add save mutation**

Import and add mutation to `job-editor.page.tsx`:

```tsx
// Add to imports
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { client, orpc } from "@/orpc/orpc-client";

// Inside JobEditorPage component, add:
const queryClient = useQueryClient();

const updateMutation = useMutation({
  mutationFn: (data: { id: string; description: string }) =>
    client.admin.jobs.update(data),
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: orpc.admin.jobs.list.queryOptions().queryKey,
    });
    toast.success("Job description saved");
    setInitialDescription(description);
  },
  onError: (error) => {
    toast.error(error.message);
  },
});

const handleSave = () => {
  if (!selectedJobId) return;
  updateMutation.mutate({ id: selectedJobId, description });
};

// Update the Save button:
<Button
  onClick={handleSave}
  disabled={!hasChanges || !selectedJobId || updateMutation.isPending}
>
  {updateMutation.isPending ? (
    <>
      <Spinner className="mr-2 size-4" />
      Saving...
    </>
  ) : (
    "Save Job"
  )}
</Button>;
```

**Step 2: Commit**

```bash
git add src/features/lab/job-editor/job-editor.page.tsx
git commit -m "feat(job-editor): add save functionality"
```

---

## Task 10: Create Index Export

**Files:**

- Create: `src/features/lab/job-editor/index.ts`

**Step 1: Create the index file**

```tsx
export { JobEditorPage } from "./job-editor.page";
```

**Step 2: Verify all files exist**

Run: `ls src/features/lab/job-editor/`
Expected:

```
index.ts
job-editor-actions.tsx
job-editor-form.tsx
job-editor-preview.tsx
job-editor.page.tsx
sliding-chat-panel.tsx
use-job-editor-ai.ts
```

**Step 3: Run type check**

Run: `bun x tsc --noEmit`
Expected: No errors

**Step 4: Run linter**

Run: `bun x ultracite check`
Expected: No errors (or fix with `bun x ultracite fix`)

**Step 5: Commit**

```bash
git add src/features/lab/job-editor/index.ts
git commit -m "feat(job-editor): add index export"
```

---

## Task 11: Test the Feature

**Step 1: Start the dev server**

Run: `bun dev`

**Step 2: Navigate to the page**

Open: `http://localhost:3000/dashboard/lab/job-editor`

**Step 3: Verify functionality**

- [ ] Page loads without errors
- [ ] Job selector dropdown shows jobs
- [ ] Selecting a job loads description
- [ ] Preview shows markdown rendered
- [ ] AI action buttons work
- [ ] Chat panel slides in/out
- [ ] Save button updates job

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(job-editor): complete implementation"
```

---

## Summary

| Task | Description                 |
| ---- | --------------------------- |
| 1    | Route file                  |
| 2    | Main page layout            |
| 3    | Form component              |
| 4    | Preview component           |
| 5    | Actions component           |
| 6    | AI hook                     |
| 7    | Sliding chat panel          |
| 8    | API endpoint                |
| 9    | Save functionality          |
| 10   | Index export + verification |
| 11   | Manual testing              |

Total: 11 tasks
