// Fetches one stock, one crypto and one commodity from the backend and saves
// the raw JSON responses so the response objects can be inspected directly.
//
// Run with: npx tsx scripts/fetch-asset-responses.ts
//
// Output (in data/):
//   stock-AAPL-response.json
//   crypto-BTC-response.json
//   commodity-GCUSD-response.json

import "dotenv/config";

import * as fs from "node:fs";
import * as path from "node:path";

import { assetEndpoint } from "@/lib/asset-api";
import type { AssetType } from "@/lib/asset-types";
import { API_BASE_URL } from "@/lib/fetch-util";

type SampleAsset = {
  type: AssetType;
  symbol: string;
  filename: string;
};

const SAMPLES: SampleAsset[] = [
  { type: "stock", symbol: "AAPL", filename: "stock-AAPL-response.json" },
  { type: "crypto", symbol: "BTC", filename: "crypto-BTC-response.json" },
  {
    type: "commodity",
    symbol: "GCUSD",
    filename: "commodity-GCUSD-response.json",
  },
];

// The backend may fetch from external providers on a cache miss.
const REQUEST_TIMEOUT_MS = 180_000;

async function fetchRawAsset(sample: SampleAsset): Promise<unknown> {
  const url = `${API_BASE_URL}${assetEndpoint(sample.type, sample.symbol)}`;

  console.log(`[asset-responses] GET ${url}`);

  const response = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `${sample.type} ${sample.symbol} failed: ${response.status} ` +
        `${response.statusText} ${body.slice(0, 200)}`
    );
  }

  return response.json();
}

async function main(): Promise<void> {
  const outputDir = path.join(process.cwd(), "data");
  fs.mkdirSync(outputDir, { recursive: true });

  for (const sample of SAMPLES) {
    const data = await fetchRawAsset(sample);
    const outputPath = path.join(outputDir, sample.filename);

    fs.writeFileSync(outputPath, `${JSON.stringify(data, null, 2)}\n`);
    console.log(`[asset-responses] Saved ${outputPath}`);
  }
}

main().catch((error: unknown) => {
  console.error("[asset-responses] Failed:", error);
  process.exitCode = 1;
});
