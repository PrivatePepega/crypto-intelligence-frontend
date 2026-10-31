import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type AssetMetric = {
  label: string;
  value: number | null;
};

type AssetSummaryCardProps = {
  /** Human-readable asset class, e.g. "Stock". */
  typeLabel: string;
  name: string;
  symbol: string;
  price: number | null;
  currency: string;
  change?: number | null;
  changePercent?: number | null;
  updatedAt?: string | null;
  description?: string | null;
  metrics?: AssetMetric[];
  /** Source note rendered in the footer, e.g. "FMP". */
  source?: string | null;
};

function formatPrice(value: number | null, currency: string): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  const fractionDigits = Math.abs(value) < 1 ? 6 : 2;

  return `${currency} ${value.toLocaleString("en-US", {
    maximumFractionDigits: fractionDigits,
  })}`;
}

function formatCompact(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatChange(
  change: number | null | undefined,
  changePercent: number | null | undefined
): string | null {
  if (change === null || change === undefined) {
    return null;
  }

  const signedChange = `${change >= 0 ? "+" : ""}${formatCompact(change)}`;

  if (changePercent === null || changePercent === undefined) {
    return signedChange;
  }

  const signedPercent = `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`;

  return `${signedChange} (${signedPercent})`;
}

export function AssetSummaryCard({
  typeLabel,
  name,
  symbol,
  price,
  currency,
  change,
  changePercent,
  updatedAt,
  description,
  metrics = [],
  source,
}: AssetSummaryCardProps) {
  const changeLabel = formatChange(change, changePercent);
  const isPositive = (change ?? 0) >= 0;

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-xl">{name}</CardTitle>
          <Badge variant="secondary">{symbol}</Badge>
          <Badge variant="outline">{typeLabel}</Badge>
        </div>

        <CardDescription>
          {description ?? "No description stored for this asset yet."}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-3xl font-semibold tracking-tight">
            {formatPrice(price, currency)}
          </span>

          {changeLabel && (
            <span
              className={cn(
                "text-sm font-medium",
                isPositive ? "text-emerald-500" : "text-destructive"
              )}
            >
              {changeLabel}
            </span>
          )}
        </div>

        {metrics.length > 0 && (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-md bg-muted/40 p-3">
                <dt className="text-xs text-muted-foreground">
                  {metric.label}
                </dt>
                <dd className="text-sm font-medium">
                  {formatCompact(metric.value)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>

      <CardContent className="text-xs text-muted-foreground">
        {updatedAt ? `Updated ${updatedAt.slice(0, 10)}` : "No update timestamp"}
        {source ? ` · Source ${source}` : ""}
      </CardContent>
    </Card>
  );
}
