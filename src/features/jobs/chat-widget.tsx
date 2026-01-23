"use client";

import { MessageCircleIcon, SendIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Loader } from "@/components/ai-elements/loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatWidgetProps = {
  jobId: string;
  className?: string;
};

type SuggestionKey =
  | "JOB_CHATBOT_SUGGESTION_SKILLS"
  | "JOB_CHATBOT_SUGGESTION_SALARY"
  | "JOB_CHATBOT_SUGGESTION_BENEFITS"
  | "JOB_CHATBOT_SUGGESTION_APPLY";

const SUGGESTION_KEYS: SuggestionKey[] = [
  "JOB_CHATBOT_SUGGESTION_SKILLS",
  "JOB_CHATBOT_SUGGESTION_SALARY",
  "JOB_CHATBOT_SUGGESTION_BENEFITS",
  "JOB_CHATBOT_SUGGESTION_APPLY",
];

export function ChatWidget({ jobId, className }: ChatWidgetProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        "[data-slot='scroll-area-viewport']"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || isLoading) {
        return;
      }

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: messageText.trim(),
      };

      const assistantMessageId = crypto.randomUUID();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setInput("");
      setIsLoading(true);

      try {
        const response = await fetch("/api/ai/job-chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jobId,
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get response");
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let accumulatedContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: accumulatedContent }
                : m
            )
          );
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: t("JOB_CHATBOT_ERROR") }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [jobId, messages, isLoading, t]
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (suggestionKey: SuggestionKey) => {
    const question = t(suggestionKey);
    sendMessage(question);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(input);
    }
  };

  if (!isOpen) {
    return (
      <Button
        aria-label={t("JOB_CHATBOT_OPEN")}
        className={cn(
          "fixed bottom-6 right-6 z-50 size-14 rounded-full shadow-lg",
          className
        )}
        onClick={() => setIsOpen(true)}
        size="icon"
        type="button"
      >
        <MessageCircleIcon className="size-6" />
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        "fixed bottom-6 right-6 z-50 flex h-[500px] w-[380px] flex-col shadow-xl",
        className
      )}
    >
      <CardHeader className="flex-shrink-0 border-b pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t("JOB_CHATBOT_TITLE")}</CardTitle>
          <Button
            aria-label={t("CLOSE")}
            onClick={() => setIsOpen(false)}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("JOB_CHATBOT_WELCOME")}
              </p>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("JOB_CHATBOT_SUGGESTIONS_LABEL")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTION_KEYS.map((key) => (
                    <Button
                      className="h-auto px-3 py-1.5 text-xs"
                      key={key}
                      onClick={() => handleSuggestionClick(key)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {t(key)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                  key={message.id}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {message.content || <Loader className="size-4" size={16} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex-shrink-0 border-t p-3">
          <form className="flex gap-2" onSubmit={handleSubmit}>
            <Input
              className="flex-1"
              disabled={isLoading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("JOB_CHATBOT_PLACEHOLDER")}
              ref={inputRef}
              type="text"
              value={input}
            />
            <Button
              aria-label={t("JOB_CHATBOT_SEND")}
              disabled={!input.trim() || isLoading}
              size="icon"
              type="submit"
            >
              <SendIcon className="size-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
