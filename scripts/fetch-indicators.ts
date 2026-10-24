// Script to fetch indicator data and save as JSON for reference
// Run with: npx tsx scripts/fetch-indicators.ts

import { fetchIndicatorData } from "@/lib/indicator-api";
import * as fs from "fs";
import * as path from "path";

// Test indicators with different frequencies
const testIndicators = [
  "ten_two_year_yield_spread",      // Daily
  "ten_year_breakeven_inflation",   // Daily
  "ten_year_treasury_yield",        // Daily
  "two_year_treasury_yield",        // Daily
  "three_m_treasury",               // Daily
  "mortgage_rate",                  // Weekly
  "aaii_sentiment",                 // Weekly
  "average_hourly_earnings",        // Monthly
  "building_permits",               // Monthly
  "real_gdp_growth",                // Quarterly
  "vix",                            // Daily
  "cftc_bitcoin",                   // Weekly
  "alternative_crypto_fear_greed",  // Daily
];

async function main() {
  console.log("Fetching indicator data...");
  console.log(`Requesting ${testIndicators.length} indicators...`);

  try {
    const response = await fetchIndicatorData({
      indicators: testIndicators,
      historyLimit: 500,
    });

    // Save to JSON file
    const outputDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, "indicator-fetch-response.json");
    fs.writeFileSync(outputPath, JSON.stringify(response, null, 2));

    console.log(`✅ Saved response to ${outputPath}`);
    console.log(`📊 Requested: ${response.requested}, Found: ${response.found}`);
    console.log(`❌ Missing: ${response.missing.join(", ") || "none"}`);

    // Print summary
    console.log("\n--- Indicator Summary ---");
    for (const item of response.indicators) {
      const { indicator, current, historical } = item;
      console.log(`\n--- ${indicator.name} (${indicator.nativeFrequency}) ---`);
      console.log(`  Series ID: ${indicator.seriesId}`);
      console.log(`  Unit: ${indicator.unit}`);
      console.log(`  Current data: ${current ? "YES" : "NO"}`);
      console.log(`  Historical rows: ${historical?.length ?? 0}`);

      if (historical && historical.length > 0) {
        const first = historical[0];
        const last = historical[historical.length - 1];
        console.log(`  Date range: ${first.date} to ${last.date}`);

        // Show available columns
        const numericCols = Object.keys(first).filter(
          (k) => k !== "date" && k !== "series_id" && typeof first[k] === "number"
        );
        console.log(`  Numeric columns: ${numericCols.join(", ")}`);
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main().catch(console.error);