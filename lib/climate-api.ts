import axios from "axios";

import { fetchData } from "@/lib/fetch-util";
import type { ClimateBrief } from "@/types";
import { climateBriefSchema } from "@/types/zodSchemas";

/**
 * Fetches the most recent climate brief.
 *
 * The backend answers 404 when no brief has been published yet. That is an
 * empty state rather than an error, so it resolves to `null`.
 */
export async function fetchClimateBrief(): Promise<ClimateBrief | null> {
  try {
    const response = await fetchData<unknown>("/climate/brief");

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
