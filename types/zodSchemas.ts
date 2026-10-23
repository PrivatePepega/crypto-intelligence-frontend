import { z } from "zod";

export const authUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  createdAt: z.string().optional(),
});

export const authResponseSchema = z.object({
  user: authUserSchema,
});

export const chatRoleSchema = z.enum(["user", "assistant"]);

export const chatMessageSchema = z.object({
  id: z.string().min(1),
  role: chatRoleSchema,
  content: z.string(),
  sequenceNumber: z.number(),
  createdAt: z.string(),
});

export const chatSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  createdAt: z.string(),
});

export const getChatResponseSchema = z.object({
  chat: chatSchema.nullable(),
  messages: z.array(chatMessageSchema),
});

export const sendChatMessageResponseSchema = z.object({
  chat: chatSchema,
  messages: z.array(chatMessageSchema).min(1),
});

export const chatbotErrorBodySchema = z.object({
  message: z.string(),
  chat: chatSchema.nullish(),
  userMessage: chatMessageSchema.nullish(),
});
