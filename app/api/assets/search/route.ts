/**
 * Asset autocomplete endpoint.
 *
 * GET /api/assets/search?q=<query>&limit=<per-class limit>
 *
 * Filters the ticker snapshots in `data/` server-side and returns only the
 * matching assets, so the browser never downloads the full lists. `limit`
 * caps the results per asset class (stocks, crypto, commodities).
 */

import { NextResponse } from "next/server";

import { searchAssets } from "@/lib/asset-search";

const MAX_QUERY_LENGTH = 100;
const DEFAULT_LIMIT_PER_TYPE = 5;
const MAX_LIMIT_PER_TYPE = 10;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();

  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      {
        error: "validation_failed",
        message: `Query must be ${MAX_QUERY_LENGTH} characters or fewer.`,
      },
      { status: 400 }
    );
  }

  if (query === "") {
    return NextResponse.json({ results: [] });
  }

  const requestedLimit = Number(searchParams.get("limit"));
  const limitPerType =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(Math.trunc(requestedLimit), MAX_LIMIT_PER_TYPE)
      : DEFAULT_LIMIT_PER_TYPE;

  try {
    const results = await searchAssets(query, limitPerType);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[asset-search] Failed to search assets:", error);

    return NextResponse.json(
      {
        error: "search_failed",
        message: "Asset search is temporarily unavailable.",
      },
      { status: 500 }
    );
  }
}
