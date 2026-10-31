import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StockAssetResponse } from "@/lib/asset-api";
import {
  formatCompactNumber,
  formatMoney,
  formatRange,
  formatSignedPercent,
} from "@/lib/asset-format";
import { cn } from "@/lib/utils";

type StockStatisticsProps = {
  market: StockAssetResponse["market"];
  currency: string;
  className?: string;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/40 p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}

type RangeBarProps = {
  label: string;
  low: number | null;
  high: number | null;
  /** Current price, used to place the marker inside the range. */
  value: number | null;
  currency: string;
};

/**
 * Shows where the current price sits between a low and a high. Purely a CSS
 * visualisation so it stays a server component.
 */
function RangeBar({ label, low, high, value, currency }: RangeBarProps) {
  const hasRange = low !== null && high !== null && high > low;

  if (!hasRange) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md bg-muted/40 p-3 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">No data</span>
      </div>
    );
  }

  const position =
    value !== null
      ? Math.min(100, Math.max(0, ((value - low) / (high - low)) * 100))
      : null;

  return (
    <div className="rounded-md bg-muted/40 p-3">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">{label}</span>
        {value !== null && (
          <span className="text-muted-foreground tabular-nums">
            Now {formatMoney(value, currency)}
          </span>
        )}
      </div>

      <div
        aria-hidden
        className="relative mt-2 h-1.5 rounded-full bg-border/70"
      >
        {position !== null && (
          <span
            className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground ring-2 ring-card"
            style={{ left: `${position}%` }}
          />
        )}
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-muted-foreground tabular-nums">
        <span>{formatMoney(low, currency)}</span>
        <span>{formatMoney(high, currency)}</span>
      </div>

      <p className="sr-only">
        {label}: {formatRange(low, high, currency)}
      </p>
    </div>
  );
}

function relativeToPrice(
  price: number | null,
  average: number | null
): number | null {
  if (price === null || average === null || average === 0) {
    return null;
  }

  return ((price - average) / average) * 100;
}

/**
 * Quote snapshot for a stock: size and liquidity, the two ranges that matter
 * for price context, and the simple moving averages the backend stores.
 */
export function StockStatistics({
  market,
  currency,
  className,
}: StockStatisticsProps) {
  const movingAverages = [
    { label: "SMA 20", value: market.movingAverages.sma20 },
    { label: "SMA 50", value: market.movingAverages.sma50 },
    { label: "SMA 200", value: market.movingAverages.sma200 },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Market statistics</CardTitle>
        <CardDescription>
          Latest quote, trading ranges and moving averages.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-3">
          <Stat
            label="Market cap"
            value={formatMoney(market.marketCap, currency, { compact: true })}
          />
          <Stat
            label="Previous close"
            value={formatMoney(market.previousClose, currency)}
          />
          <Stat
            label="Volume"
            value={formatCompactNumber(market.volume)}
          />
          <Stat
            label="Average volume"
            value={formatCompactNumber(market.averageVolume)}
          />
        </dl>

        <div className="grid gap-3 sm:grid-cols-2">
          <RangeBar
            label="Day range"
            low={market.dayLow}
            high={market.dayHigh}
            value={market.price}
            currency={currency}
          />
          <RangeBar
            label="52-week range"
            low={market.yearLow}
            high={market.yearHigh}
            value={market.price}
            currency={currency}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-muted-foreground">
            Moving averages
          </h3>

          <dl className="grid grid-cols-3 gap-3">
            {movingAverages.map((average) => {
              const difference = relativeToPrice(
                market.price,
                average.value
              );

              return (
                <div
                  key={average.label}
                  className="rounded-md bg-muted/40 p-3"
                >
                  <dt className="text-xs text-muted-foreground">
                    {average.label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium tabular-nums">
                    {formatMoney(average.value, currency)}
                  </dd>
                  {difference !== null && (
                    <p
                      className={cn(
                        "mt-0.5 text-xs tabular-nums",
                        difference >= 0 ? "text-emerald-500" : "text-destructive"
                      )}
                    >
                      {formatSignedPercent(difference)} vs price
                    </p>
                  )}
                </div>
              );
            })}
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}
