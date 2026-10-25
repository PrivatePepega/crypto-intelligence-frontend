import type { z } from "zod";

import type {
  authUserSchema,
  chatMessageSchema,
  chatSchema,
  indicatorResponseSchema,
  indicatorDataItemSchema,
  fetchIndicatorDataResponseSchema,
  climateBriefSchema,
  weatherBriefSchema,
  weatherBriefSectionSchema,
  weatherHumanBriefSchema,
} from "./zodSchemas";

export type AuthUser = z.infer<typeof authUserSchema>;
export type Chat = z.infer<typeof chatSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRole = ChatMessage["role"];

export type Indicator = z.infer<typeof indicatorResponseSchema>;
export type IndicatorDataItem = z.infer<typeof indicatorDataItemSchema>;
export type FetchIndicatorDataResponse = z.infer<typeof fetchIndicatorDataResponseSchema>;

export type WeatherBrief = z.infer<typeof weatherBriefSchema>;
export type WeatherBriefSection = z.infer<typeof weatherBriefSectionSchema>;
export type WeatherHumanBrief = z.infer<typeof weatherHumanBriefSchema>;

export type ClimateBrief = z.infer<typeof climateBriefSchema>;
