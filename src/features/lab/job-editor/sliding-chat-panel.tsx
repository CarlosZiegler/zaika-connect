"use client";

import type { ChatStatus } from "ai";

import { CheckIcon, ClipboardPasteIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
  applied?: boolean;
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

  const handleApply = (messageId: string, content: string) => {
    onDescriptionChange(content);
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, applied: true } : m))
    );
    toast.success("Applied to description");
  };

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
        assistantContent += chunk;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: assistantContent } : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const status: ChatStatus = isStreaming ? "streaming" : "ready";

  return (
    <div
      className={cn(
        "flex h-full flex-col border-l bg-background transition-all duration-300 ease-in-out",
        isOpen ? "w-1/4 min-w-80" : "w-0 min-w-0 overflow-hidden border-l-0"
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <span className="font-medium">AI Assistant</span>
        <Button variant="ghost" size="icon-sm" onClick={onClose} type="button">
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
              E.g., &quot;Make it more professional&quot; or &quot;Add remote
              work benefits&quot;
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-2">
                <Message from={msg.role}>
                  <MessageContent>
                    <MessageResponse>{msg.content}</MessageResponse>
                  </MessageContent>
                </Message>
                {msg.role === "assistant" && msg.content && !isStreaming && (
                  <div className="ml-10">
                    {msg.applied ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                        <CheckIcon className="size-3" />
                        Applied to description
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleApply(msg.id, msg.content)}
                        className="h-7 text-xs"
                      >
                        <ClipboardPasteIcon className="mr-1.5 size-3" />
                        Apply to Description
                      </Button>
                    )}
                  </div>
                )}
              </div>
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
