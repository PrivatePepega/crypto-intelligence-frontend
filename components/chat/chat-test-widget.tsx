"use client";

import { Bot, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ChatTestInterface } from "@/components/chat/chat-test-interface";
import { useTestChatbot } from "@/hooks/use-test-chatbot";

export function ChatTestWidget() {
  const { isLoading } = useTestChatbot(false);
  const [isOpen, setIsOpen] = useState(false);
  const signInRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isOpen && (
        <section
          id="assistant-panel-test"
          role="dialog"
          aria-label="CryptoIntel test assistant"
          className="flex h-[min(42rem,calc(100dvh-7rem))] max-h-[calc(100dvh-7rem)] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl"
        >
          <header className="flex shrink-0 items-center justify-between border-b px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                <Bot className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">CryptoIntel Test Assistant</p>
                <p className="truncate text-xs text-muted-foreground">
                  {isLoading ? "Checking your session..." : "Test mode - enter any username"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close assistant"
              className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </header>

          <ChatTestInterface key="test-chat" />
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close assistant" : "Open assistant"}
        aria-expanded={isOpen}
        aria-controls={isOpen ? "assistant-panel-test" : undefined}
        aria-haspopup="dialog"
        className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {isOpen ? <X className="size-6" /> : <Bot className="size-6" />}
      </button>
    </div>
  );
}