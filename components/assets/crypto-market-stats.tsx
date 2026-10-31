import { TrendingUp, TrendingDown, DollarSign, Activity, RotateCcw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CryptoAssetResponse } from "@/lib/asset-api";
import { formatMoney, formatPercent, formatCompactNumber, hasValue, formatDate } from "@/lib/asset-format";
import { cn } from "@/lib/utils";

type CryptoMarketStatsProps = {
  market: CryptoAssetResponse["market"];
  currency: string;
};

function renderValue(key: string, value: number | null | undefined, currency: string): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";

  if (key.includes("Percent") || key.includes("Dominance")) {
    return formatPercent(value);
  }
  if (key.includes("price") || key.includes("Cap") || key.includes("Volume") || key.includes("Valuation") || key.includes("High") || key.includes("Low")) {
    return formatMoney(value, currency);
  }
  return formatCompactNumber(value);
}

function getChangeColor(value: number | null | undefined): string {
  if (value === null || value === undefined) return "text-muted-foreground";
  return value >= 0 ? "text-emerald-500" : "text-destructive";
}

const STAT_GROUPS: Array<{
  label: string;
  keys: Array<{ key: string; label: string }>;
}> = [
  {
    label: "Price & Change",
    keys: [
      { key: "price", label: "Current Price" },
      { key: "change24h", label: "24h Change" },
      { key: "changePercent24h", label: "24h Change %" },
      { key: "changeSincePreviousClose", label: "Since Prev Close" },
      { key: "changePercentSincePreviousClose", label: "Since Prev Close %" },
    ],
  },
  {
    label: "24h Range",
    keys: [
      { key: "high24h", label: "24h High" },
      { key: "low24h", label: "24h Low" },
    ],
  },
  {
    label: "Market Cap & Volume",
    keys: [
      { key: "marketCap", label: "Market Cap" },
      { key: "marketCapRank", label: "Market Cap Rank" },
      { key: "fullyDilutedValuation", label: "FDV" },
      { key: "marketCapDominance", label: "Dominance %" },
      { key: "volume24h", label: "24h Volume" },
      { key: "quoteVolume24h", label: "Quote Volume" },
      { key: "volumeToMarketCap", label: "Vol / MCap" },
    ],
  },
  {
    label: "All-Time",
    keys: [
      { key: "allTimeHigh", label: "All-Time High" },
      { key: "allTimeHighDate", label: "ATH Date" },
      { key: "allTimeLow", label: "All-Time Low" },
      { key: "allTimeLowDate", label: "ATL Date" },
    ],
  },
  {
    label: "Performance",
    keys: [
      { key: "priceChange7d", label: "7d Change %" },
      { key: "priceChange30d", label: "30d Change %" },
      { key: "priceChange90d", label: "90d Change %" },
    ],
  },
];

export function CryptoMarketStats({ market, currency }: CryptoMarketStatsProps) {
  const hasData = STAT_GROUPS.some((group) =>
    group.keys.some((k) => hasValue((market as Record<string, unknown>)[k.key]))
  );

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-4" />
            Market Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No market data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-4" />
          Market Statistics
        </CardTitle>
        <CardDescription>Key market metrics and performance indicators</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {STAT_GROUPS.map((group) => {
          const validKeys = group.keys.filter((k) =>
            hasValue((market as Record<string, unknown>)[k.key])
          );
          if (validKeys.length === 0) return null;

          return (
            <div key={group.label} className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h4>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {validKeys.map(({ key, label }) => {
                  const value = (market as Record<string, unknown>)[key];
                  const isPercent = key.includes("Percent") || key.includes("Dominance");
                  const isDate = key.includes("Date");
                  const isRank = key === "marketCapRank";
                  const isRatio = key === "volumeToMarketCap";

                  return (
                    <div
                      key={key}
                      className="rounded-md bg-muted/40 p-3"
                    >
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className={cn("text-sm font-medium tabular-nums", isPercent && getChangeColor(value as number))}>
                        {isDate && value
                          ? formatDate(value as string)
                          : isRank
                          ? `#${value}`
                          : isRatio
                          ? typeof value === "number" && Number.isFinite(value)
                            ? `${value.toFixed(2)}x`
                            : "—"
                          : renderValue(key, value as number | null, currency)}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          );
        })}
        {market.source && (
          <p className="text-xs text-muted-foreground border-t border-border/60 pt-3">
            Source: {market.source}
          </p>
        )}
      </CardContent>
    </Card>
  );
}