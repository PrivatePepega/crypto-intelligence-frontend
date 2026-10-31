/**
 * Typed client for the asset intelligence endpoints:
 *
 *   GET /api-v1/stocks/:ticker
 *   GET /api-v1/crypto/:ticker
 *   GET /api-v1/commodities/:ticker
 *
 * Each endpoint accepts a ticker/symbol and answers with the stored
 * intelligence for that asset. Responses are validated before use because the
 * backend aggregates several external providers.
 */

import axios from "axios";
import { z } from "zod";

import type { AssetType } from "@/lib/asset-types";
import { fetchData } from "@/lib/fetch-util";

/**
 * The backend may fetch from external providers and write to the database on a
 * cache miss, so these requests are slower than a plain lookup.
 */
const ASSET_REQUEST_TIMEOUT_MS = 90_000;

const nullableNumber = z.number().nullable();
const nullableString = z.string().nullable();

/**
 * A single 10-Q/10-K extract. Values the provider did not report are null;
 * some balance-sheet figures also arrive as `0` when a filing only covered the
 * income statement, which the UI treats as missing.
 */
const stockFinancialReportSchema = z.object({
  form: z.string(),
  fiscalYear: nullableNumber,
  fiscalPeriod: nullableString,
  periodEnd: nullableString,
  filingDate: nullableString,
  accessionNumber: nullableString,
  revenue: nullableNumber,
  grossProfit: nullableNumber,
  operatingIncome: nullableNumber,
  netIncome: nullableNumber,
  totalAssets: nullableNumber,
  totalLiabilities: nullableNumber,
  cashAndCashEquivalents: nullableNumber,
  operatingCashFlow: nullableNumber,
  capitalExpenditures: nullableNumber,
  freeCashFlow: nullableNumber,
  currency: z.string(),
  sourceUrl: nullableString,
});

const emptyMovingAverages = { sma20: null, sma50: null, sma200: null };

const movingAveragesSchema = z
  .object({
    sma20: nullableNumber,
    sma50: nullableNumber,
    sma200: nullableNumber,
  })
  .default(emptyMovingAverages);

export const stockAssetSchema = z.object({
  ticker: z.string(),
  company: z.object({
    name: z.string(),
    exchange: nullableString,
    currency: z.string(),
    // Newer response fields default to null so older cached payloads still parse.
    cik: nullableString.default(null),
    sector: nullableString,
    industry: nullableString,
    description: nullableString,
    website: nullableString,
    country: nullableString.default(null),
    logoUrl: nullableString,
    marketCap: nullableNumber.default(null),
    averageVolume: nullableNumber.default(null),
  }),
  market: z.object({
    price: nullableNumber,
    previousClose: nullableNumber.default(null),
    change: nullableNumber,
    changePercent: nullableNumber,
    marketCap: nullableNumber,
    volume: nullableNumber,
    averageVolume: nullableNumber.default(null),
    dayHigh: nullableNumber,
    dayLow: nullableNumber,
    yearHigh: nullableNumber,
    yearLow: nullableNumber,
    priceUpdatedAt: nullableString,
    movingAverages: movingAveragesSchema,
  }),
  history: z.unknown().nullable().optional(),
  financialReports: z
    .object({
      quarterly: z.array(stockFinancialReportSchema),
      annual: z.array(stockFinancialReportSchema),
    })
    .default({ quarterly: [], annual: [] }),
  dataUpdatedAt: nullableString,
});

export const cryptoAssetSchema = z.object({
  symbol: z.string(),
  asset: z.object({
    name: z.string(),
    symbol: z.string(),
    category: nullableString,
    description: nullableString,
    logoUrl: nullableString,
    website: nullableString,
    externalIds: z
      .object({
        coingeckoId: nullableString,
      })
      .nullable()
      .optional(),
  }),
  market: z.object({
    price: nullableNumber,
    currency: z.string(),
    change24h: nullableNumber,
    changePercent24h: nullableNumber,
    changeSincePreviousClose: nullableNumber.default(null),
    changePercentSincePreviousClose: nullableNumber.default(null),
    high24h: nullableNumber.default(null),
    low24h: nullableNumber.default(null),
    marketCap: nullableNumber,
    marketCapRank: nullableNumber.default(null),
    fullyDilutedValuation: nullableNumber.default(null),
    marketCapDominance: nullableNumber.default(null),
    volume24h: nullableNumber,
    quoteVolume24h: nullableNumber.default(null),
    volumeToMarketCap: nullableNumber.default(null),
    allTimeHigh: nullableNumber.default(null),
    allTimeHighDate: nullableString.default(null),
    allTimeLow: nullableNumber.default(null),
    allTimeLowDate: nullableString.default(null),
    priceChange7d: nullableNumber.default(null),
    priceChange30d: nullableNumber.default(null),
    priceChange90d: nullableNumber.default(null),
    priceUpdatedAt: nullableString,
    source: nullableString,
  }),
  supply: z.object({
    circulating: nullableNumber,
    total: nullableNumber,
    max: nullableNumber,
    circulatingPercentage: nullableNumber.default(null),
  }),
  network: z
    .object({
      primary: nullableString,
      contracts: z
        .array(
          z.object({
            network: z.string(),
            address: z.string(),
          })
        )
        .default([]),
    })
    .nullable()
    .optional()
    .default({ primary: null, contracts: [] }),
  tokenomics: z
    .object({
      categories: z.array(z.string()).default([]),
      genesisDate: nullableString,
      hashingAlgorithm: nullableString,
      blockTimeInMinutes: nullableNumber,
      hasSupplyBreakdown: z.boolean().default(false),
    })
    .nullable()
    .optional()
    .default({ categories: [], genesisDate: null, hashingAlgorithm: null, blockTimeInMinutes: null, hasSupplyBreakdown: false }),
  security: z
    .object({
      summary: nullableString,
      contractAnalysis: z.record(z.string(), z.unknown()).default({}),
      riskFlags: z.array(z.string()).default([]),
    })
    .nullable()
    .optional()
    .default({ summary: null, contractAnalysis: {}, riskFlags: [] }),
  socials: z
    .object({
      homepage: z.array(z.string()).default([]),
      whitepaper: nullableString,
      blockchainSites: z.array(z.string()).default([]),
      officialForumUrls: z.array(z.string()).default([]),
      chatUrls: z.array(z.string()).default([]),
      announcementUrls: z.array(z.string()).default([]),
      twitter: nullableString,
      telegram: nullableString,
      subreddit: nullableString,
      discord: nullableString.optional(),
      repos: z
        .object({
          github: z.array(z.string()).default([]),
          bitbucket: z.array(z.string()).default([]),
        })
        .default({ github: [], bitbucket: [] }),
    })
    .nullable()
    .optional()
    .default({
      homepage: [],
      whitepaper: null,
      blockchainSites: [],
      officialForumUrls: [],
      chatUrls: [],
      announcementUrls: [],
      twitter: null,
      telegram: null,
      subreddit: null,
      discord: null,
      repos: { github: [], bitbucket: [] },
    }),
  exchanges: z
    .array(
      z.object({
        name: z.string(),
        symbol: z.string(),
        volume24h: nullableNumber,
        quoteVolume24h: nullableNumber,
        percentOfTotalVolume: nullableNumber,
        isVerified: z.boolean().default(false),
      })
    )
    .default([]),
  dataUpdatedAt: nullableString,
});

export const commodityAssetSchema = z.object({
  symbol: z.string(),
  asset: z.object({
    name: z.string(),
    symbol: z.string(),
    category: nullableString,
    description: nullableString,
    logoUrl: nullableString,
    website: nullableString,
    externalIds: z
      .object({
        fmpSymbol: nullableString,
      })
      .nullable()
      .optional(),
  }),
  commodity: z.object({
    type: nullableString,
    benchmark: nullableString,
    currency: z.string(),
    unitOfMeasure: nullableString,
    uses: z.array(z.string()).default([]),
    contract: z.object({
      exchange: nullableString,
      tradeMonth: nullableString,
      contractYear: nullableString,
    }),
  }),
  market: z.object({
    price: nullableNumber,
    currency: z.string(),
    change: nullableNumber,
    changePercent: nullableNumber,
    previousClose: nullableNumber.default(null),
    open: nullableNumber.default(null),
    dayHigh: nullableNumber,
    dayLow: nullableNumber,
    yearHigh: nullableNumber,
    yearLow: nullableNumber,
    volume: nullableNumber,
    vwap: nullableNumber.default(null),
    movingAverages: z
      .object({
        sma50: nullableNumber,
        sma200: nullableNumber,
      })
      .nullable()
      .default(null),
    priceUpdatedAt: nullableString,
    source: nullableString,
    yearLowDate: nullableString.default(null),
    priceChange7d: nullableNumber.default(null),
    priceChange90d: nullableNumber.default(null),
  }),
  fundamentals: z
    .object({
      valueDrivers: z.record(z.string(), z.unknown()).default({}),
      supplyDemand: z.record(z.string(), z.unknown()).default({}),
      inflation: z.record(z.string(), z.unknown()).default({}),
    })
    .nullable()
    .optional()
    .default({ valueDrivers: {}, supplyDemand: {}, inflation: {} }),
  history: z
    .object({
      interval: nullableString,
      firstObservation: nullableString,
      lastObservation: nullableString,
      observationCount: nullableNumber,
      lastUpdatedAt: nullableString,
    })
    .nullable()
    .optional()
    .default({ interval: null, firstObservation: null, lastObservation: null, observationCount: null, lastUpdatedAt: null }),
  dataUpdatedAt: nullableString,
});

export type StockAssetResponse = z.infer<typeof stockAssetSchema>;
export type StockFinancialReport = z.infer<typeof stockFinancialReportSchema>;
export type CryptoAssetResponse = z.infer<typeof cryptoAssetSchema>;
export type CommodityAssetResponse = z.infer<typeof commodityAssetSchema>;

const ENDPOINT_SEGMENTS: Record<AssetType, string> = {
  stock: "stocks",
  crypto: "crypto",
  commodity: "commodities",
};

/** Builds the backend path for an asset, e.g. `/stocks/AAPL`. */
export function assetEndpoint(type: AssetType, symbol: string): string {
  return `/${ENDPOINT_SEGMENTS[type]}/${encodeURIComponent(symbol)}`;
}

/** True when the backend rejected the ticker as unrecognized. */
export function isWrongTickerError(error: unknown): boolean {
  return axios.isAxiosError<unknown, unknown, unknown>(error) && error.response?.status === 404;
}

async function requestAsset<T>(
  type: AssetType,
  symbol: string,
  schema: z.ZodType<T>
): Promise<T> {
  const response = await fetchData<unknown>(
    assetEndpoint(type, symbol),
    undefined,
    ASSET_REQUEST_TIMEOUT_MS
  );

  const parsed = schema.safeParse(response);

  if (!parsed.success) {
    console.error(`[${type}] Zod validation errors for ${symbol}:`, parsed.error.flatten());
    throw new Error(`Invalid ${type} asset response: ${parsed.error.message}`);
  }

  return parsed.data;
}

export async function fetchStockAsset(
  ticker: string
): Promise<StockAssetResponse> {
  return requestAsset("stock", ticker, stockAssetSchema);
}

export async function fetchCryptoAsset(
  symbol: string
): Promise<CryptoAssetResponse> {
  return requestAsset("crypto", symbol, cryptoAssetSchema);
}

export async function fetchCommodityAsset(
  symbol: string
): Promise<CommodityAssetResponse> {
  return requestAsset("commodity", symbol, commodityAssetSchema);
}
