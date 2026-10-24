import { postData } from "@/lib/fetch-util";
import type { FetchIndicatorDataResponse } from "@/types";
import { fetchIndicatorDataResponseSchema } from "@/types/zodSchemas";

export interface FetchIndicatorDataParams {
  indicators: string[];
  from?: string;
  to?: string;
  historyLimit?: number;
}

export async function fetchIndicatorData(
  params: FetchIndicatorDataParams
): Promise<FetchIndicatorDataResponse> {
  const response = await postData<unknown>("/fetchData", params);

  const parsed = fetchIndicatorDataResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new Error("Invalid indicator data response");
  }

  return parsed.data;
}