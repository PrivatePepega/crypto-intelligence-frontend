import { fetchData, postData } from "@/lib/fetch-util";
import type {
  FetchIndicatorDataResponse,
  IndicatorCatalogueResponse,
} from "@/types";
import {
  fetchIndicatorDataResponseSchema,
  indicatorCatalogueResponseSchema,
} from "@/types/zodSchemas";

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

/**
 * Loads the public indicator catalogue. The explorer uses it to build the
 * domain and category navigation; `/fetchData` still supplies the values.
 */
export async function fetchIndicatorCatalogue(): Promise<IndicatorCatalogueResponse> {
  const response = await fetchData<unknown>("/indicators");

  const parsed = indicatorCatalogueResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new Error("Invalid indicator catalogue response");
  }

  return parsed.data;
}