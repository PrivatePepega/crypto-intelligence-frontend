"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  ChatbotApiError,
  getChat,
  sendChatMessage,
} from "@/lib/chatbot-api";
import type { Chat, ChatMessage } from "@/types";

export const MAX_CHAT_MESSAGE_LENGTH = 8_000;

export type ChatSendResult =
  | { ok: true }
  | { ok: false; restoreDraft: boolean };

export function useChatbot(open: boolean) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(open);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const chatIdRef = useRef<string | undefined>(undefined);
  const isLoadingRef = useRef(false);
  const isSendingRef = useRef(false);

  const load = useCallback(async () => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setLoadError(null);

    try {
      const requestedChatId = chatIdRef.current;
      const result = await getChat(requestedChatId).catch(async (cause) => {
        // A stale stored chat ID should fall back to the latest chat.
        if (
          cause instanceof ChatbotApiError &&
          cause.status === 404 &&
          requestedChatId
        ) {
          chatIdRef.current = undefined;
          setChat(null);

          return getChat();
        }

        throw cause;
      });

      setChat(result.chat);
      setMessages(
        [...result.messages].sort(
          (a, b) => a.sequenceNumber - b.sequenceNumber
        )
      );
      chatIdRef.current = result.chat?.id;
    } catch (cause) {
      if (cause instanceof ChatbotApiError && cause.status === 401) {
        window.dispatchEvent(new Event("force-logout"));
      }

      setLoadError(getLoadErrorMessage(cause));
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    void load();
  }, [open, load]);

  const send = useCallback(
    async (rawMessage: string): Promise<ChatSendResult> => {
      const message = rawMessage.trim();

      if (!message || isSendingRef.current) {
        return { ok: false, restoreDraft: false };
      }

      if (message.length > MAX_CHAT_MESSAGE_LENGTH) {
        setError(
          `Message must be at most ${MAX_CHAT_MESSAGE_LENGTH.toLocaleString()} characters.`
        );

        return { ok: false, restoreDraft: true };
      }

      isSendingRef.current = true;
      setError(null);
      setIsSending(true);

      const optimisticId = `temp-${crypto.randomUUID()}`;
      const optimisticMessage: ChatMessage = {
        id: optimisticId,
        role: "user",
        content: message,
        sequenceNumber: Number.MAX_SAFE_INTEGER,
        createdAt: new Date().toISOString(),
      };

      setMessages((current) => [...current, optimisticMessage]);

      try {
        const result = await sendChatMessage(message, chatIdRef.current);

        setChat(result.chat);
        chatIdRef.current = result.chat.id;

        setMessages((current) => {
          const withoutOptimistic = current.filter(
            (item) => item.id !== optimisticId
          );
          const byId = new Map(
            withoutOptimistic.map((item) => [item.id, item])
          );

          for (const item of result.messages) {
            byId.set(item.id, item);
          }

          return [...byId.values()].sort(
            (a, b) => a.sequenceNumber - b.sequenceNumber
          );
        });

        return { ok: true };
      } catch (cause) {
        const apiError = cause instanceof ChatbotApiError ? cause : null;
        const savedUserMessage = apiError?.body?.userMessage;

        if (savedUserMessage) {
          setMessages((current) => {
            const withoutOptimistic = current.filter(
              (item) => item.id !== optimisticId
            );

            if (
              withoutOptimistic.some((item) => item.id === savedUserMessage.id)
            ) {
              return withoutOptimistic;
            }

            return [...withoutOptimistic, savedUserMessage].sort(
              (a, b) => a.sequenceNumber - b.sequenceNumber
            );
          });
        } else {
          setMessages((current) =>
            current.filter((item) => item.id !== optimisticId)
          );
        }

        if (apiError?.body?.chat) {
          setChat(apiError.body.chat);
          chatIdRef.current = apiError.body.chat.id;
        }

        if (!apiError) {
          setError(
            "Could not reach the chatbot. Check your connection and try refreshing."
          );
          void load();

          return { ok: false, restoreDraft: false };
        }

        if (apiError.status === 401) {
          setError("Your session expired. Please sign in again.");
          window.dispatchEvent(new Event("force-logout"));

          return { ok: false, restoreDraft: false };
        }

        if (apiError.status === 403) {
          setError(
            "The chatbot request was blocked by the API origin check. Check that the frontend origin matches the backend FRONTEND_URL."
          );

          return { ok: false, restoreDraft: false };
        }

        if (apiError.status === 404) {
          setError("That chat no longer exists. Loading your latest chat.");
          chatIdRef.current = undefined;
          setChat(null);
          void load();

          return { ok: false, restoreDraft: false };
        }

        if (apiError.status === 400) {
          setError(apiError.message);

          return { ok: false, restoreDraft: true };
        }

        setError(apiError.message);

        if (!savedUserMessage) {
          void load();
        }

        return { ok: false, restoreDraft: false };
      } finally {
        isSendingRef.current = false;
        setIsSending(false);
      }
    },
    [load]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    chat,
    messages,
    isLoading,
    isSending,
    error,
    loadError,
    load,
    send,
    clearError,
  };
}

function getLoadErrorMessage(cause: unknown): string {
  if (cause instanceof ChatbotApiError) {
    if (cause.status === 401) {
      return "Please sign in to use the chatbot.";
    }

    if (cause.status === 403) {
      return "The chatbot request was blocked by the API origin check.";
    }

    return cause.message;
  }

  return "Could not load the chatbot. Please try again.";
}
