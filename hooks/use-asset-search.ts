"use client";

import { useEffect, useState } from "react";

import type { AssetSearchResult } from "@/lib/asset-types";

const DEBOUNCE_MS = 200;

type AssetSearchResponse = {
  results?: unknown;
};

type SearchState = {
  /** Query the stored results belong to. */
  query: string;
  results: AssetSearchResult[];
  error: string | null;
};

const EMPTY_STATE: SearchState = { query: "", results: [], error: null };

/** Stable reference so callers can compare arrays by identity. */
const NO_RESULTS: AssetSearchResult[] = [];

function isAssetSearchResult(value: unknown): value is AssetSearchResult {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    (candidate["type"] === "stock" ||
      candidate["type"] === "crypto" ||
      candidate["type"] === "commodity") &&
    typeof candidate["id"] === "string" &&
    typeof candidate["symbol"] === "string" &&
    typeof candidate["name"] === "string"
  );
}

/**
 * Debounced autocomplete against `/api/assets/search`.
 *
 * Results carry the query they were fetched for, so the caller never sees
 * matches from an older input. Pending requests are aborted when the query
 * changes.
 */
export function useAssetSearch(query: string) {
  const trimmed = query.trim();
  const [state, setState] = useState<SearchState>(EMPTY_STATE);

  useEffect(() => {
    if (trimmed === "") {
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/assets/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`Asset search failed with ${response.status}`);
        }

        const body = (await response.json()) as AssetSearchResponse;
        const matches = Array.isArray(body.results)
          ? body.results.filter(isAssetSearchResult)
          : [];

        setState({ query: trimmed, results: matches, error: null });
      } catch (caught) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("[asset-search] Request failed:", caught);
        setState({
          query: trimmed,
          results: [],
          error: "Asset search is temporarily unavailable.",
        });
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [trimmed]);

  const isSettled = state.query === trimmed;

  if (trimmed === "") {
    return { results: NO_RESULTS, isLoading: false, error: null };
  }

  // Keep the previous matches visible while the next request is in flight so
  // the panel does not blank out on every keystroke.
  return {
    results: state.results,
    isLoading: !isSettled,
    error: isSettled ? state.error : null,
  };
}
