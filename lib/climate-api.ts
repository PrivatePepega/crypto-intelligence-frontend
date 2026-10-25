import axios from "axios";

import type { BriefQuery } from "@/lib/brief-query";
import { toBriefQueryParams } from "@/lib/brief-query";
import { fetchData } from "@/lib/fetch-util";
import type { ClimateBrief } from "@/types";
import { climateBriefSchema } from "@/types/zodSchemas";

/**
 * Fetches the climate brief for a date, or the most recent one when
 * `query.latest` is set.
 *
 * The backend answers 404 when no brief exists for that selection. That is an
 * empty state rather than an error, so it resolves to `null`.
 */
export async function fetchClimateBrief(
  query: BriefQuery = {}
): Promise<ClimateBrief | null> {
  try {
    const response = await fetchData<unknown>(
      "/climate/brief",
      toBriefQueryParams(query)
    );

    const parsed = climateBriefSchema.safeParse(response);

    if (!parsed.success) {
      throw new Error("Invalid climate brief response");
    }

    return parsed.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw error;
  }
}
