import axios from "axios";

import { fetchData } from "@/lib/fetch-util";
import type { WeatherBrief } from "@/types";
import { weatherBriefSchema } from "@/types/zodSchemas";

/**
 * Fetches the most recent daily brief.
 *
 * The backend answers 404 when no brief has been published yet. That is an
 * empty state rather than an error, so it resolves to `null`.
 */
export async function fetchWeatherBrief(): Promise<WeatherBrief | null> {
  try {
    const response = await fetchData<unknown>("/weather/brief");

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
