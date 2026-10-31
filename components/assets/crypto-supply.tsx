import { CircleDollarSign, Coins, PieChart } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CryptoAssetResponse } from "@/lib/asset-api";
import { formatCompactNumber, hasValue } from "@/lib/asset-format";
import { cn } from "@/lib/utils";

type CryptoSupplyProps = {
  supply: CryptoAssetResponse["supply"];
};

export function CryptoSupply({ supply }: CryptoSupplyProps) {
  const hasData = hasValue(supply.circulating) || hasValue(supply.total) || hasValue(supply.max);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="size-4" />
            Supply
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No supply data available.</p>
        </CardContent>
      </Card>
    );
  }

  const circulating = supply.circulating ?? 0;
  const total = supply.total ?? 0;
  const max = supply.max ?? 0;
  const circulatingPct = supply.circulatingPercentage ?? (max > 0 ? (circulating / max) * 100 : null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="size-4" />
          Supply
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {hasValue(supply.circulating) && (
            <div className="rounded-md bg-muted/40 p-3">
              <dt className="text-xs text-muted-foreground">Circulating</dt>
              <dd className="text-sm font-medium tabular-nums">{formatCompactNumber(circulating)}</dd>
            </div>
          )}
          {hasValue(supply.total) && (
            <div className="rounded-md bg-muted/40 p-3">
              <dt className="text-xs text-muted-foreground">Total</dt>
              <dd className="text-sm font-medium tabular-nums">{formatCompactNumber(total)}</dd>
            </div>
          )}
          {hasValue(supply.max) && (
            <div className="rounded-md bg-muted/40 p-3">
              <dt className="text-xs text-muted-foreground">Max Supply</dt>
              <dd className="text-sm font-medium tabular-nums">{formatCompactNumber(max)}</dd>
            </div>
          )}
          {circulatingPct !== null && (
            <div className="rounded-md bg-muted/40 p-3">
              <dt className="text-xs text-muted-foreground">Circulating %</dt>
              <dd className="text-sm font-medium tabular-nums">{circulatingPct.toFixed(2)}%</dd>
            </div>
          )}
        </dl>

        {(circulatingPct !== null || (max > 0 && circulating > 0)) && (
          <div className="space-y-2 border-t border-border/60 pt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Circulating Supply</span>
              <span>{circulatingPct !== null ? `${circulatingPct.toFixed(1)}%` : "—"}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(circulatingPct ?? 0, 100)}%` }}
              />
            </div>
            {max > 0 && (
              <p className="text-xs text-muted-foreground">
                {formatCompactNumber(circulating)} of {formatCompactNumber(max)} tokens in circulation
              </p>
            )}
          </div>
        )}

        {(supply.circulatingPercentage !== null || max > 0) && (
          <div className="flex flex-wrap gap-2">
            {max > 0 && (
              <Badge variant="outline" className="gap-1">
                <PieChart className="size-3" />
                Max Supply: {formatCompactNumber(max)}
              </Badge>
            )}
            {total > 0 && total !== max && (
              <Badge variant="secondary" className="gap-1">
                <Coins className="size-3" />
                Total Minted: {formatCompactNumber(total)}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}