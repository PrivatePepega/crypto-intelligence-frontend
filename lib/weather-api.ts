import axios from "axios";

import type { BriefQuery } from "@/lib/brief-query";
import { toBriefQueryParams } from "@/lib/brief-query";
import { fetchData, postData } from "@/lib/fetch-util";
import type {
  WeatherBrief,
  WeatherObservationsResearchResponse,
} from "@/types";
import {
  weatherBriefSchema,
  weatherObservationsResearchResponseSchema,
} from "@/types/zodSchemas";

/**
 * Fetches the daily brief for a date, or the most recent one when
 * `query.latest` is set.
 *
 * The backend answers 404 when no brief exists for that selection. That is an
 * empty state rather than an error, so it resolves to `null`.
 */
export async function fetchWeatherBrief(
  query: BriefQuery = {}
): Promise<WeatherBrief | null> {
  try {
    const response = await fetchData<unknown>(
      "/weather/brief",
      toBriefQueryParams(query)
    );

    const parsed = weatherBriefSchema.safeParse(response);

    if (!parsed.success) {
      throw new Error("Invalid weather brief response");
    }

    return parsed.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw error;
  }
}

/**
 * Fetches stored observations and their research for the requested domains on
 * a single date, or the most recent stored data when `query.latest` is set.
 */
export async function fetchWeatherObservationsResearch(
  domains: string[],
  query: BriefQuery = {}
): Promise<WeatherObservationsResearchResponse> {
  const response = await postData<unknown>(
    "/weather/observations-research",
    { domains },
    toBriefQueryParams(query)
  );

  const parsed = weatherObservationsResearchResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new Error("Invalid observations and research response");
  }

  return parsed.data;
}
