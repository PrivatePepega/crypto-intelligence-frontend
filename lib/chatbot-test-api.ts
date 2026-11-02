import { z } from "zod";

import { API_BASE_URL } from "@/lib/fetch-util";
import {
  chatMessageSchema,
  chatSchema,
} from "@/types/zodSchemas";

const CHATBOT_TEST_BASE_URL = `${API_BASE_URL.replace(/\/+$/, "")}/chatbottest`;

export type TestChatResponse = z.infer<typeof getTestChatResponseSchema>;
export type TestSendMessageResponse = z.infer<
  typeof sendTestChatMessageResponseSchema
>;
export type TestLoginResponse = z.infer<typeof testLoginResponseSchema>;
export type TestChatbotErrorBody = z.infer<typeof testChatbotErrorBodySchema>;

export class TestChatbotApiError extends Error {
  readonly status: number;
  readonly body: TestChatbotErrorBody | null;

  constructor(status: number, body: TestChatbotErrorBody | null) {
    super(body?.message ?? `Test chatbot request failed (${status}).`);
    this.name = "TestChatbotApiError";
    this.status = status;
    this.body = body;
  }
}

// Schemas matching the backend test API responses
export const testLoginResponseSchema = z.object({
  user: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    createdAt: z.string(),
  }),
});

export const getTestChatResponseSchema = z.object({
  chat: chatSchema.nullable(),
  messages: z.array(chatMessageSchema),
});

export const sendTestChatMessageResponseSchema = z.object({
  chat: chatSchema,
  messages: z.array(chatMessageSchema).min(1),
});

export const testChatbotErrorBodySchema = z.object({
  message: z.string(),
  chat: chatSchema.nullish(),
  userMessage: chatMessageSchema.nullish(),
});

async function testChatbotRequest(
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${CHATBOT_TEST_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsedError = testChatbotErrorBodySchema.safeParse(body);

    throw new TestChatbotApiError(
      response.status,
      parsedError.success
        ? parsedError.data
        : {
            message:
              response.statusText.trim() ||
              `Test chatbot request failed (${response.status}).`,
          }
    );
  }

  return body;
}

function unexpectedResponse(): TestChatbotApiError {
  return new TestChatbotApiError(502, {
    message: "The test chatbot returned an unexpected response.",
  });
}

export async function testLogin(
  username: string
): Promise<TestLoginResponse> {
  const body = await testChatbotRequest("/login", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
  const parsed = testLoginResponseSchema.safeParse(body);

  if (!parsed.success) {
    throw unexpectedResponse();
  }

  return parsed.data;
}

export async function testGetHistory(
  username: string,
  chatId?: string
): Promise<TestChatResponse> {
  const query = new URLSearchParams();
  query.set("username", username);
  if (chatId) {
    query.set("chatId", chatId);
  }
  const body = await testChatbotRequest(`/history?${query.toString()}`);
  const parsed = getTestChatResponseSchema.safeParse(body);

  if (!parsed.success) {
    throw unexpectedResponse();
  }

  return parsed.data;
}

export async function testSendMessage(
  username: string,
  message: string,
  chatId?: string
): Promise<TestSendMessageResponse> {
  const body = await testChatbotRequest("/messages", {
    method: "POST",
    body: JSON.stringify({
      username,
      message,
      ...(chatId ? { chatId } : {}),
    }),
  });
  const parsed = sendTestChatMessageResponseSchema.safeParse(body);

  if (!parsed.success) {
    throw unexpectedResponse();
  }

  return parsed.data;
}