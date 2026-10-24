"use client";

import { Bot, Loader2, Lock, Send, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/components/providers/auth-context-provider";
import { Button } from "@/components/ui/button";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message";
import {
  MAX_CHAT_MESSAGE_LENGTH,
  useChatbot,
  type ChatSendResult,
} from "@/hooks/use-chatbot";
import type { ChatMessage } from "@/types";

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <Message align={isUser ? "end" : "start"} className="gap-2">
      {!isUser && (
        <MessageAvatar className="size-7 bg-muted text-muted-foreground [&_svg]:size-4">
          <Bot aria-hidden="true" />
        </MessageAvatar>
      )}
      <MessageContent className="min-w-0 max-w-[88%] gap-1">
        <span className="sr-only">{isUser ? "You said: " : "Assistant said: "}</span>
        <Bubble align={isUser ? "end" : "start"} variant={isUser ? "default" : "muted"} className="max-w-full">
          <BubbleContent>{message.content}</BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
}

function ChatComposer({
  isLoading,
  isSending,
  onSend,
}: {
  isLoading: boolean;
  isSending: boolean;
  onSend: (content: string) => Promise<ChatSendResult>;
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isBusy = isLoading || isSending;

  useEffect(() => {
    if (!isBusy) {
      inputRef.current?.focus();
    }
  }, [isBusy]);

  const submit = async () => {
    const content = input.trim();

    if (!content || isBusy) return;

    setInput("");

    const result = await onSend(content);

    if (!result.ok && result.restoreDraft) {
      setInput(content);
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="border-t bg-background/90 p-3"
    >
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              void submit();
            }
          }}
          maxLength={MAX_CHAT_MESSAGE_LENGTH}
          disabled={isBusy}
          placeholder={
            isLoading
              ? "Loading conversation..."
              : isSending
                ? "Waiting for the assistant..."
                : "Ask the market chatbot..."
          }
          aria-label="Message"
          className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border bg-muted/20 px-3 py-2 text-sm outline-none transition focus:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <Button
          type="submit"
          size="icon"
          aria-label="Send message"
          disabled={isBusy || !input.trim()}
        >
          {isSending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>AI can make mistakes. Verify important information.</span>

        {input.length > MAX_CHAT_MESSAGE_LENGTH - 1000 && (
          <span className="shrink-0 tabular-nums">
            {input.length.toLocaleString()}/
            {MAX_CHAT_MESSAGE_LENGTH.toLocaleString()}
          </span>
        )}
      </div>
    </form>
  );
}

function EmptyChatState() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Bot className="size-5" />
      </div>

      <div>
        <p className="text-sm font-semibold">Ask about the market</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask about markets, assets, indicators, or macro conditions.
        </p>
      </div>
    </div>
  );
}

function SignedInChat() {
  const {
    messages,
    isLoading,
    isSending,
    error,
    loadError,
    load,
    send,
    clearError,
  } = useChatbot(true);

  const messagesRef = useRef<HTMLDivElement>(null);
  const lastMessage = messages.at(-1);

  useEffect(() => {
    const container = messagesRef.current;

    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isSending, isLoading]);

  return (
    <>
      <div
        ref={messagesRef}
        role="log"
        aria-live="polite"
        aria-busy={isSending}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
      >
        {isLoading && messages.length === 0 && (
          <div className="flex min-h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading conversation...
          </div>
        )}

        {isLoading && messages.length > 0 && (
          <p className="text-center text-xs text-muted-foreground">
            Refreshing conversation...
          </p>
        )}

        {loadError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
            <p className="break-words text-destructive">{loadError}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => void load()}
              disabled={isLoading || isSending}
            >
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !loadError && messages.length === 0 && (
          <EmptyChatState />
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isSending && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
              <Loader2 className="size-4 animate-spin" />
            </div>
            Researching...
          </div>
        )}

        {!isLoading &&
          !loadError &&
          !isSending &&
          !error &&
          lastMessage?.role === "user" && (
            <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <span>The last message has no reply yet.</span>
              <button
                type="button"
                onClick={() => void load()}
                className="font-medium text-foreground hover:underline"
              >
                Refresh
              </button>
            </div>
          )}
      </div>

      {error && (
        <div
          role="alert"
          className="border-t bg-destructive/10 px-4 py-2 text-xs text-destructive"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="break-words">{error}</p>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  clearError();
                  void load();
                }}
                disabled={isLoading || isSending}
                className="rounded px-1.5 py-0.5 font-medium hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-50"
              >
                Refresh
              </button>

              <button
                type="button"
                onClick={clearError}
                aria-label="Dismiss error"
                className="rounded p-0.5 hover:bg-destructive/10"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <ChatComposer
        isLoading={isLoading}
        isSending={isSending}
        onSend={send}
      />
    </>
  );
}

export function ChatWidget() {
  const { user, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const signInRef = useRef<HTMLAnchorElement>(null);

  // Close the panel with Escape from anywhere.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Move keyboard focus into the panel when it opens for a signed-out user.
  useEffect(() => {
    if (isOpen && !isLoading && !user) {
      signInRef.current?.focus();
    }
  }, [isOpen, isLoading, user]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isOpen && (
        <section
          id="assistant-panel"
          role="dialog"
          aria-label="CryptoIntel assistant"
          className="flex h-[32rem] max-h-[calc(100dvh-8rem)] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl"
        >
          <header className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                <Bot className="size-5" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  CryptoIntel Assistant
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {isLoading
                    ? "Checking your session..."
                    : user
                      ? "Crypto research assistant"
                      : "Sign in required"}
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
                  Sign in to your account to have access to the CryptoIntel
                  assistant.
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
            <SignedInChat key={user.id} />
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
