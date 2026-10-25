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
  weatherObservationSchema,
  weatherResearchEntrySchema,
  weatherResearchDetailsSchema,
  weatherObservationsResearchResponseSchema,
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

export type WeatherObservation = z.infer<typeof weatherObservationSchema>;
export type WeatherResearchEntry = z.infer<typeof weatherResearchEntrySchema>;
export type WeatherResearchDetails = z.infer<
  typeof weatherResearchDetailsSchema
>;
export type WeatherObservationsResearchResponse = z.infer<
  typeof weatherObservationsResearchResponseSchema
>;

export type ClimateBrief = z.infer<typeof climateBriefSchema>;

/**
 * A brief query for a specific date. When that date has no stored data the
 * hooks fall back to the latest available record and mark `isFallback`.
 */
export interface DatedBriefResult<T> {
  data: T | null;
  isFallback: boolean;
}
