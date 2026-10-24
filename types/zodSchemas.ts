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

// Indicator schemas
export const indicatorResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  seriesId: z.string(),
  domain: z.string(),
  category: z.string(),
  description: z.string(),
  source: z.string(),
  nativeTimeUnit: z.string(),
  nativeFrequency: z.string(),
  nativeAggregation: z.string(),
  historicalTimeUnit: z.string().optional(),
  unit: z.string(),
  use: z.string(),
  purpose: z.string(),
  significance: z.string(),
  relationTags: z.array(z.string()),
  status: z.enum(["active", "inactive"]),
});

export const indicatorDataItemSchema = z.object({
  indicator: indicatorResponseSchema,
  current: z.record(z.string(), z.unknown()).nullable(),
  historical: z.array(z.record(z.string(), z.unknown())),
  currentTable: z.string().nullable(),
  historicalTable: z.string().nullable(),
});

export const fetchIndicatorDataResponseSchema = z.object({
  requested: z.number(),
  found: z.number(),
  missing: z.array(z.string()),
  indicators: z.array(indicatorDataItemSchema),
});

export const fetchIndicatorDataRequestSchema = z.object({
  indicators: z.array(z.string().trim().min(1).max(200)).min(1).max(25),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  historyLimit: z.number().int().min(1).max(10000).optional(),
});
