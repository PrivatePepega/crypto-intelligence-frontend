import React from "react";
import { TrendingUp, TrendingDown, DollarSign, Activity, RotateCcw, Minus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { CommodityAssetResponse } from "@/lib/asset-api";
import { formatMoney, formatPercent, formatCompactNumber, hasValue, formatDate } from "@/lib/asset-format";
import { cn } from "@/lib/utils";

type CommodityMarketStatsProps = {
  market: CommodityAssetResponse["market"];
  currency: string;
};

function renderValue(key: string, value: number | null | undefined, currency: string): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";

  if (key.includes("Percent") || key.includes("changePercent")) {
    return formatPercent(value);
  }
  if (key.includes("price") || key.includes("Close") || key.includes("Open") || key.includes("High") || key.includes("Low") || key.includes("VWAP")) {
    return formatMoney(value, currency);
  }
  if (key.includes("Volume") || key.includes("volume")) {
    return formatCompactNumber(value);
  }
  if (key.includes("MovingAverage") || key.includes("SMA") || key.includes("sma")) {
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
      { key: "previousClose", label: "Previous Close" },
      { key: "open", label: "Open" },
      { key: "change", label: "Change" },
      { key: "changePercent", label: "Change %" },
    ],
  },
  {
    label: "Session Range",
    keys: [
      { key: "dayHigh", label: "Day High" },
      { key: "dayLow", label: "Day Low" },
    ],
  },
  {
    label: "52-Week Range",
    keys: [
      { key: "yearHigh", label: "Year High" },
      { key: "yearHighDate", label: "Year High Date" },
      { key: "yearLow", label: "Year Low" },
      { key: "yearLowDate", label: "Year Low Date" },
    ],
  },
  {
    label: "Volume & VWAP",
    keys: [
      { key: "volume", label: "Volume" },
      { key: "vwap", label: "VWAP" },
    ],
  },
  {
    label: "Moving Averages",
    keys: [
      { key: "movingAveragesSma50", label: "SMA 50" },
      { key: "movingAveragesSma200", label: "SMA 200" },
    ],
  },
  {
    label: "Performance",
    keys: [
      { key: "priceChange7d", label: "7d Change %" },
      { key: "priceChange90d", label: "90d Change %" },
    ],
  },
];

export function CommodityMarketStats({ market, currency }: CommodityMarketStatsProps) {
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
          const validKeys = group.keys.filter((k) => {
            const val = (market as Record<string, unknown>)[k.key];
            if (k.key === "movingAverages") {
              return hasValue(val) && typeof val === "object" && val !== null;
            }
            return hasValue(val);
          });
          if (validKeys.length === 0) return null;

          return (
            <div key={group.label} className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h4>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {validKeys.map(({ key, label }) => {
                  const value = (market as Record<string, unknown>)[key];
                  const isPercent = key.includes("Percent") || key.includes("changePercent");
                  const isDate = key.includes("Date");
                  const isMovingAverage = key === "movingAveragesSma50" || key === "movingAveragesSma200";

                  if (isMovingAverage) {
                    const ma = (market as Record<string, unknown>)["movingAverages"] as { sma50?: number | null; sma200?: number | null } | null;
                    if (key === "movingAveragesSma50") {
                      return hasValue(ma?.sma50) ? (
                        <div key={key} className="rounded-md bg-muted/40 p-3">
                          <dt className="text-xs text-muted-foreground">SMA 50</dt>
                          <dd className="text-sm font-medium tabular-nums">{formatMoney(ma.sma50!, currency)}</dd>
                        </div>
                      ) : null;
                    }
                    if (key === "movingAveragesSma200") {
                      return hasValue(ma?.sma200) ? (
                        <div key={key} className="rounded-md bg-muted/40 p-3">
                          <dt className="text-xs text-muted-foreground">SMA 200</dt>
                          <dd className="text-sm font-medium tabular-nums">{formatMoney(ma.sma200!, currency)}</dd>
                        </div>
                      ) : null;
                    }
                  }

                  return (
                    <div
                      key={key}
                      className="rounded-md bg-muted/40 p-3"
                    >
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className={cn("text-sm font-medium tabular-nums", isPercent && getChangeColor(value as number))}>
                        {isDate && value
                          ? formatDate(value as string)
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