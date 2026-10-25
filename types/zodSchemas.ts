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

// Weather brief schemas
//
// The brief body is model-generated text stored as JSONB, so fields fall back
// to safe defaults instead of failing the whole response. The page renders the
// strings as plain text; nothing here is trusted as markup or data.
export const weatherBriefSectionSchema = z.object({
  heading: z.string().catch(""),
  body: z.string().catch(""),
  key_figures: z
    .record(z.string(), z.union([z.string(), z.number()]))
    .catch({}),
});

export const weatherHumanBriefSchema = z.object({
  date: z.string().catch(""),
  title: z.string().catch(""),
  executive_summary: z.string().catch(""),
  sections: z.array(weatherBriefSectionSchema).catch([]),
  market_outlook: z.string().catch(""),
  key_takeaways: z.array(z.string()).catch([]),
  uncertainties: z.array(z.string()).catch([]),
  upcoming_catalysts: z.array(z.string()).catch([]),
});

export const weatherBriefSchema = z.object({
  brief_date: z.string(),
  domain: z.string().catch(""),
  human_brief: weatherHumanBriefSchema,
  created_at: z.string().optional(),
});

// Weather observations and research
export const weatherObservationSchema = z.object({
  id: z.string(),
  date: z.string(),
  market_domain: z.string(),
  type: z.string(),
  observation: z.string(),
  research_enabled: z.boolean(),
  created_at: z.string(),
});

export const weatherResearchEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  market_domain: z.string(),
  type: z.string(),
  observation: z.string(),
  research: z.string().catch(""),
  created_at: z.string(),
  observation_id: z.string(),
});

/**
 * The research column stores a JSON string produced by the model. Fields fall
 * back to safe defaults so one malformed value cannot break the whole row.
 */
export const weatherResearchDetailsSchema = z.object({
  finding: z.string().catch(""),
  importance: z.string().catch(""),
  evidence: z.string().catch(""),
  sources: z.array(z.string()).catch([]),
  context: z.string().catch(""),
  uncertainty: z.string().catch(""),
  status: z.string().catch(""),
});

export const weatherObservationsResearchResponseSchema = z.object({
  domains: z.array(z.string()),
  observations: z.array(weatherObservationSchema),
  research: z.array(weatherResearchEntrySchema),
});

// Climate brief schemas
//
// Each stored section is markdown-ish model output and may be null while a
// brief is being assembled, so every section falls back to `null`.
const climateBriefSectionSchema = z.string().nullish().catch(null);

export const climateBriefSchema = z.object({
  date: z.string(),
  human_brief_global_overview: climateBriefSectionSchema,
  human_brief_macro_market_regime: climateBriefSectionSchema,
  human_brief_sector_conditions: climateBriefSectionSchema,
  human_brief_important_stories_narratives: climateBriefSectionSchema,
  human_brief_trends_capital_direction: climateBriefSectionSchema,
  human_brief_outlook_risks_uncertainties: climateBriefSectionSchema,
  created_at: z.string().optional(),
});
