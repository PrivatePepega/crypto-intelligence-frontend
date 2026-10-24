"use client";

import { Bot, Loader2, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message";
import { MAX_CHAT_MESSAGE_LENGTH, useChatbot, type ChatSendResult } from "@/hooks/use-chatbot";
import type { ChatMessage } from "@/types";

function ChatTurn({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <Message align={isUser ? "end" : "start"}>
      {!isUser && (
        <MessageAvatar className="size-8 self-start bg-muted text-muted-foreground [&_svg]:size-4">
          <Bot aria-hidden="true" />
        </MessageAvatar>
      )}
      <MessageContent className="min-w-0 max-w-[88%]">
        <Bubble
          align={isUser ? "end" : "start"}
          variant={isUser ? "muted" : "ghost"}
          className="max-w-full"
        >
          <BubbleContent>{message.content}</BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
}

function ChatPrompt({
  isLoading,
  isSending,
  onSend,
}: {
  isLoading: boolean;
  isSending: boolean;
  onSend: (content: string) => Promise<ChatSendResult>;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const busy = isLoading || isSending;

  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy]);

  async function submit() {
    const content = value.trim();
    if (!content || busy) return;

    setValue("");
    const result = await onSend(content);
    if (!result.ok && result.restoreDraft) setValue(content);
  }

  return (
    <form
      className="border-t p-3"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <InputGroup className="h-auto min-h-12 rounded-xl">
        <InputGroupTextarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder={isSending ? "Waiting for a response..." : "Ask CryptoIntel anything..."}
          aria-label="Message"
          maxLength={MAX_CHAT_MESSAGE_LENGTH}
          disabled={busy}
          rows={1}
          className="max-h-32 min-h-10 resize-none border-0 bg-transparent py-3 shadow-none focus-visible:ring-0"
        />
        <InputGroupAddon align="inline-end" className="self-end pb-1">
          <InputGroupButton
            type="submit"
            variant="default"
            size="icon-sm"
            aria-label="Send message"
            disabled={busy || !value.trim()}
          >
            {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <div className="mt-2 flex justify-between gap-2 text-[11px] text-muted-foreground">
        <span>Enter to send · Shift+Enter for a new line</span>
        {value.length > MAX_CHAT_MESSAGE_LENGTH - 1000 && (
          <span>{value.length}/{MAX_CHAT_MESSAGE_LENGTH}</span>
        )}
      </div>
    </form>
  );
}

export function ChatInterface() {
  const { messages, isLoading, isSending, error, loadError, load, send, clearError } = useChatbot(true);
  const lastMessage = messages.at(-1);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MessageScrollerProvider autoScroll>
        <MessageScroller className="min-h-0 flex-1">
          <MessageScrollerViewport>
            <MessageScrollerContent className="gap-6 p-4">
              {isLoading && messages.length === 0 && (
                <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading conversation...
                </div>
              )}

              {loadError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
                  <p className="text-destructive">{loadError}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => void load()} disabled={isLoading || isSending}>
                    Retry loading
                  </Button>
                </div>
              )}

              {!isLoading && !loadError && messages.length === 0 && (
                <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <Bot className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="font-medium">CryptoIntel Assistant</h2>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      Ask about crypto projects, markets, on-chain activity, or the forces shaping financial markets.
                    </p>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <MessageScrollerItem
                  key={message.id}
                  messageId={message.id}
                  scrollAnchor={message.role === "user"}
                >
                  <ChatTurn message={message} />
                </MessageScrollerItem>
              ))}

              {isSending && (
                <MessageScrollerItem messageId="assistant-thinking">
                  <Message>
                    <MessageAvatar className="size-8 self-start bg-muted text-muted-foreground">
                      <Bot className="size-4" />
                    </MessageAvatar>
                    <MessageContent>
                      <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        Researching...
                      </div>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              )}

              {!isLoading && !loadError && !isSending && !error && lastMessage?.role === "user" && (
                <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <span>Your last message has no reply yet.</span>
                  <button type="button" onClick={() => void load()} className="font-medium text-foreground hover:underline">
                    Refresh
                  </button>
                </div>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>

      {error && (
        <div role="alert" className="flex items-start justify-between gap-3 border-t bg-destructive/10 px-4 py-2 text-xs text-destructive">
          <p className="break-words">{error}</p>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => { clearError(); void load(); }} disabled={isLoading || isSending} className="font-medium hover:underline disabled:opacity-50">
              Retry
            </button>
            <button type="button" onClick={clearError} aria-label="Dismiss error" className="rounded p-0.5 hover:bg-destructive/10">
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      <ChatPrompt isLoading={isLoading} isSending={isSending} onSend={send} />
    </div>
  );
}
