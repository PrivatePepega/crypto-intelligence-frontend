import type { z } from "zod";

import { API_BASE_URL } from "@/lib/fetch-util";
import {
  chatbotErrorBodySchema,
  getChatResponseSchema,
  sendChatMessageResponseSchema,
} from "@/types/zodSchemas";

const CHATBOT_BASE_URL = `${API_BASE_URL.replace(/\/+$/, "")}/chatbot`;

export type GetChatResponse = z.infer<typeof getChatResponseSchema>;
export type SendChatMessageResponse = z.infer<
  typeof sendChatMessageResponseSchema
>;
export type ChatbotErrorBody = z.infer<typeof chatbotErrorBodySchema>;

export class ChatbotApiError extends Error {
  readonly status: number;
  readonly body: ChatbotErrorBody | null;

  constructor(status: number, body: ChatbotErrorBody | null) {
    super(body?.message ?? `Chatbot request failed (${status}).`);
    this.name = "ChatbotApiError";
    this.status = status;
    this.body = body;
  }
}

async function chatbotRequest(
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${CHATBOT_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsedError = chatbotErrorBodySchema.safeParse(body);

    throw new ChatbotApiError(
      response.status,
      parsedError.success
        ? parsedError.data
        : {
            message:
              response.statusText.trim() ||
              `Chatbot request failed (${response.status}).`,
          }
    );
  }

  return body;
}

function unexpectedResponse(): ChatbotApiError {
  return new ChatbotApiError(502, {
    message: "The chatbot returned an unexpected response.",
  });
}

export async function getChat(chatId?: string): Promise<GetChatResponse> {
  const query = chatId ? `?chatId=${encodeURIComponent(chatId)}` : "";
  const body = await chatbotRequest(`/messages${query}`);
  const parsed = getChatResponseSchema.safeParse(body);

  if (!parsed.success) {
    throw unexpectedResponse();
  }

  return parsed.data;
}

export async function sendChatMessage(
  message: string,
  chatId?: string
): Promise<SendChatMessageResponse> {
  const body = await chatbotRequest("/messages", {
    method: "POST",
    body: JSON.stringify({
      message,
      ...(chatId ? { chatId } : {}),
    }),
  });
  const parsed = sendChatMessageResponseSchema.safeParse(body);

  if (!parsed.success) {
    throw unexpectedResponse();
  }

  return parsed.data;
}
