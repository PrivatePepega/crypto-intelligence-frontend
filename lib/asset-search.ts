/**
 * Server-side asset search index.
 *
 * Builds an in-memory index from the ticker snapshots in `data/` and answers
 * autocomplete queries against it. Only the matched subset is sent to the
 * browser, so the multi-megabyte ticker files never reach the client bundle.
 *
 * Files:
 *   data/stock-tickers.json       -> { "<index>": { cik_str, ticker, title } }
 *   data/crypto-tickers.json      -> [{ id, symbol, name }]
 *   data/commodities-tickers.json -> [{ symbol, name, ... }]
 *
 * This module uses `node:fs` and must only be imported from server code
 * (route handlers, server components, scripts).
 */

import fs from "node:fs/promises";
import path from "node:path";

import type { AssetSearchResult, AssetType } from "@/lib/asset-types";
import { ASSET_TYPE_ORDER } from "@/lib/asset-types";

const DATA_DIR = path.join(process.cwd(), "data");

const STOCK_FILE = "stock-tickers.json";
const CRYPTO_FILE = "crypto-tickers.json";
const COMMODITY_FILE = "commodities-tickers.json";

type IndexedAsset = AssetSearchResult & {
  symbolLower: string;
  nameLower: string;
};

/** Lower is better; `null` means the asset does not match. */
const MATCH_EXACT = 0;
const MATCH_NAME_PREFIX = 1;
const MATCH_SYMBOL_PREFIX = 2;
const MATCH_NAME_CONTAINS = 3;
const MATCH_SYMBOL_CONTAINS = 4;

let indexPromise: Promise<IndexedAsset[]> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function toIndexedAsset(
  type: AssetType,
  id: string,
  symbol: string,
  name: string
): IndexedAsset {
  return {
    type,
    id,
    symbol,
    name,
    symbolLower: symbol.toLowerCase(),
    nameLower: name.toLowerCase(),
  };
}

function buildStockIndex(raw: unknown): IndexedAsset[] {
  if (!isRecord(raw)) {
    return [];
  }

  const assets: IndexedAsset[] = [];

  for (const entry of Object.values(raw)) {
    if (!isRecord(entry)) {
      continue;
    }

    const symbol = readString(entry["ticker"]);
    const name = readString(entry["title"]);

    if (!symbol || !name) {
      continue;
    }

    // SEC tickers are already uppercase; the route keeps that form.
    assets.push(toIndexedAsset("stock", symbol, symbol, name));
  }

  return assets;
}

function buildCryptoIndex(raw: unknown): IndexedAsset[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const assets: IndexedAsset[] = [];

  for (const entry of raw) {
    if (!isRecord(entry)) {
      continue;
    }

    const id = readString(entry["id"]);
    const symbol = readString(entry["symbol"]);
    const name = readString(entry["name"]);

    // The backend resolves crypto by ticker, so entries without a symbol
    // cannot be requested and are left out of the index.
    if (!id || !symbol || !name) {
      continue;
    }

    assets.push(toIndexedAsset("crypto", id, symbol, name));
  }

  return assets;
}

function buildCommodityIndex(raw: unknown): IndexedAsset[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const assets: IndexedAsset[] = [];

  for (const entry of raw) {
    if (!isRecord(entry)) {
      continue;
    }

    const symbol = readString(entry["symbol"]);
    const name = readString(entry["name"]);

    if (!symbol || !name) {
      continue;
    }

    assets.push(toIndexedAsset("commodity", symbol, symbol, name));
  }

  return assets;
}

async function readTickerFile(filename: string): Promise<unknown> {
  const raw = await fs.readFile(path.join(DATA_DIR, filename), "utf8");
  return JSON.parse(raw) as unknown;
}

async function buildIndex(): Promise<IndexedAsset[]> {
  const [stocks, crypto, commodities] = await Promise.all([
    readTickerFile(STOCK_FILE),
    readTickerFile(CRYPTO_FILE),
    readTickerFile(COMMODITY_FILE),
  ]);

  return [
    ...buildStockIndex(stocks),
    ...buildCryptoIndex(crypto),
    ...buildCommodityIndex(commodities),
  ];
}

/**
 * Loads the index once per server process. A failed load is not cached so a
 * later request can retry.
 */
function loadIndex(): Promise<IndexedAsset[]> {
  if (!indexPromise) {
    indexPromise = buildIndex().catch((error: unknown) => {
      indexPromise = null;
      throw error;
    });
  }

  return indexPromise;
}

function scoreAsset(asset: IndexedAsset, queryLower: string): number | null {
  // An exact ticker or an exact name is the strongest signal. Both share a
  // tier because some crypto entries reuse a ticker as their name (and vice
  // versa); the sort tie-break prefers the shorter, more canonical name.
  if (asset.symbolLower === queryLower || asset.nameLower === queryLower) {
    return MATCH_EXACT;
  }

  if (asset.nameLower.startsWith(queryLower)) {
    return MATCH_NAME_PREFIX;
  }

  if (asset.symbolLower.startsWith(queryLower)) {
    return MATCH_SYMBOL_PREFIX;
  }

  if (asset.nameLower.includes(queryLower)) {
    return MATCH_NAME_CONTAINS;
  }

  if (asset.symbolLower.includes(queryLower)) {
    return MATCH_SYMBOL_CONTAINS;
  }

  return null;
}

function compareMatches(
  a: { asset: IndexedAsset; score: number },
  b: { asset: IndexedAsset; score: number }
): number {
  if (a.score !== b.score) {
    return a.score - b.score;
  }

  // Prefer the shorter name: canonical assets ("Dogecoin") sort above
  // derivative tokens ("Buff Doge Coin") that share the same match tier.
  if (a.asset.name.length !== b.asset.name.length) {
    return a.asset.name.length - b.asset.name.length;
  }

  const byName = a.asset.nameLower.localeCompare(b.asset.nameLower);

  if (byName !== 0) {
    return byName;
  }

  return a.asset.symbolLower.localeCompare(b.asset.symbolLower);
}

/**
 * Returns the best matches for each asset class, ordered by match quality
 * (exact ticker/name, name prefix, ticker prefix, then substrings).
 *
 * `limitPerType` is applied per class rather than globally so a strong crypto
 * match cannot crowd commodities or stocks out of the panel.
 */
export async function searchAssets(
  query: string,
  limitPerType = 5
): Promise<AssetSearchResult[]> {
  const trimmed = query.trim();

  if (trimmed === "" || limitPerType <= 0) {
    return [];
  }

  const queryLower = trimmed.toLowerCase();
  const index = await loadIndex();

  const buckets = new Map<AssetType, Array<{ asset: IndexedAsset; score: number }>>();

  for (const type of ASSET_TYPE_ORDER) {
    buckets.set(type, []);
  }

  for (const asset of index) {
    const score = scoreAsset(asset, queryLower);

    if (score === null) {
      continue;
    }

    buckets.get(asset.type)?.push({ asset, score });
  }

  const results: AssetSearchResult[] = [];

  for (const type of ASSET_TYPE_ORDER) {
    const bucket = buckets.get(type) ?? [];
    bucket.sort(compareMatches);

    for (const { asset } of bucket.slice(0, limitPerType)) {
      results.push({
        type: asset.type,
        id: asset.id,
        symbol: asset.symbol,
        name: asset.name,
      });
    }
  }

  return results;
}

/**
 * Resolves a detail-page route segment back to its indexed asset.
 *
 * Crypto routes use the CoinGecko id (e.g. `dogecoin`) while the backend needs
 * the ticker (`DOGE`); stock and commodity routes use the ticker directly.
 */
export async function findAssetByRouteId(
  type: AssetType,
  routeId: string
): Promise<AssetSearchResult | null> {
  const target = routeId.trim().toLowerCase();

  if (target === "") {
    return null;
  }

  const index = await loadIndex();

  // The route segment is the canonical id for crypto (CoinGecko slug) and the
  // ticker for stocks/commodities. Prefer an exact id match so a derivative
  // token that reuses a ticker cannot hijack a canonical slug.
  const byId = index.find(
    (asset) => asset.type === type && asset.id.toLowerCase() === target
  );

  if (byId) {
    return {
      type: byId.type,
      id: byId.id,
      symbol: byId.symbol,
      name: byId.name,
    };
  }

  const bySymbol = index.find(
    (asset) => asset.type === type && asset.symbolLower === target
  );

  if (!bySymbol) {
    return null;
  }

  return {
    type: bySymbol.type,
    id: bySymbol.id,
    symbol: bySymbol.symbol,
    name: bySymbol.name,
  };
}
