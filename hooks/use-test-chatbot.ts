"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  TestChatbotApiError,
  testGetHistory,
  testLogin,
  testSendMessage,
  type TestChatResponse,
  type TestSendMessageResponse,
} from "@/lib/chatbot-test-api";
import type { Chat, ChatMessage } from "@/types";

export const MAX_CHAT_MESSAGE_LENGTH = 8_000;

export type TestChatSendResult =
  | { ok: true }
  | { ok: false; restoreDraft: boolean };

export interface TestUser {
  id: string;
  name: string;
  createdAt: string;
}

export function useTestChatbot(open: boolean) {
  const [user, setUser] = useState<TestUser | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const chatIdRef = useRef<string | undefined>(undefined);
  const isLoadingRef = useRef(false);
  const isSendingRef = useRef(false);

  const load = useCallback(async () => {
    if (!user) return;
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setLoadError(null);

    try {
      const requestedChatId = chatIdRef.current;
      const result = await testGetHistory(user.name, requestedChatId).catch(
        async (cause) => {
          // A stale stored chat ID should fall back to the latest chat.
          if (
            cause instanceof TestChatbotApiError &&
            cause.status === 404 &&
            requestedChatId
          ) {
            chatIdRef.current = undefined;
            setChat(null);

            return testGetHistory(user.name);
          }

          throw cause;
        }
      );

      setChat(result.chat);
      setMessages(
        [...result.messages].sort(
          (a, b) => a.sequenceNumber - b.sequenceNumber
        )
      );
      chatIdRef.current = result.chat?.id;
    } catch (cause) {
      setLoadError(getLoadErrorMessage(cause));
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!open) return;

    void load();
  }, [open, load]);

  const login = useCallback(async (username: string): Promise<TestUser> => {
    setError(null);
    const result = await testLogin(username);
    const newUser: TestUser = {
      id: result.user.id,
      name: result.user.name,
      createdAt: result.user.createdAt,
    };
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setChat(null);
    setMessages([]);
    chatIdRef.current = undefined;
  }, []);

  const send = useCallback(
    async (rawMessage: string): Promise<TestChatSendResult> => {
      if (!user) {
        return { ok: false, restoreDraft: false };
      }

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
        const result = await testSendMessage(
          user.name,
          message,
          chatIdRef.current
        );

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
        const apiError = cause instanceof TestChatbotApiError ? cause : null;
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
            "Could not reach the test chatbot. Check your connection and try refreshing."
          );
          void load();

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
    [user, load]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    user,
    chat,
    messages,
    isLoading,
    isSending,
    error,
    loadError,
    login,
    logout,
    load,
    send,
    clearError,
  };
}

function getLoadErrorMessage(cause: unknown): string {
  if (cause instanceof TestChatbotApiError) {
    if (cause.status === 404) {
      return "User not found. Please log in again.";
    }

    return cause.message;
  }

  return "Could not load the test chatbot. Please try again.";
}