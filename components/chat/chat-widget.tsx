"use client";

import { Bot, Loader2, Lock, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ChatInterface } from "@/components/chat/chat-interface";
import { useAuth } from "@/components/providers/auth-context-provider";

export function ChatWidget() {
  const { user, isLoading } = useAuth();
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

  useEffect(() => {
    if (isOpen && !isLoading && !user) signInRef.current?.focus();
  }, [isOpen, isLoading, user]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isOpen && (
        <section
          id="assistant-panel"
          role="dialog"
          aria-label="CryptoIntel assistant"
          className="flex h-[min(42rem,calc(100dvh-7rem))] max-h-[calc(100dvh-7rem)] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl"
        >
          <header className="flex shrink-0 items-center justify-between border-b px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                <Bot className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">CryptoIntel Assistant</p>
                <p className="truncate text-xs text-muted-foreground">
                  {isLoading ? "Checking your session..." : user ? "Crypto research assistant" : "Sign in required"}
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

          {isLoading ? (
            <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Checking your session...
            </div>
          ) : !user ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Lock className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">You need to log in</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign in to your account to access the CryptoIntel assistant.
                </p>
              </div>
              <Link
                ref={signInRef}
                href="/user"
                onClick={() => setIsOpen(false)}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                Sign in
              </Link>
            </div>
          ) : (
            <ChatInterface key={user.id} />
          )}
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close assistant" : "Open assistant"}
        aria-expanded={isOpen}
        aria-controls={isOpen ? "assistant-panel" : undefined}
        aria-haspopup="dialog"
        className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {isOpen ? <X className="size-6" /> : <Bot className="size-6" />}
      </button>
    </div>
  );
}
