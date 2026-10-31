import { Calendar, BarChart3, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CommodityAssetResponse } from "@/lib/asset-api";
import { formatCompactNumber, hasValue, formatDate } from "@/lib/asset-format";

type CommodityHistoryProps = {
  history: NonNullable<CommodityAssetResponse["history"]>;
};

export function CommodityHistory({ history }: CommodityHistoryProps) {
  const hasData = hasValue(history.interval) || hasValue(history.firstObservation) || hasValue(history.lastObservation);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-4" />
            Historical Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No historical data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="size-4" />
          Historical Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {hasValue(history.interval) && (
            <div className="rounded-md bg-muted/40 p-3">
              <dt className="text-xs text-muted-foreground">Interval</dt>
              <dd className="text-sm font-medium">{history.interval}</dd>
            </div>
          )}
          {hasValue(history.firstObservation) && (
            <div className="rounded-md bg-muted/40 p-3">
              <dt className="text-xs text-muted-foreground">First Observation</dt>
              <dd className="text-sm font-medium">{formatDate(history.firstObservation!)}</dd>
            </div>
          )}
          {hasValue(history.lastObservation) && (
            <div className="rounded-md bg-muted/40 p-3">
              <dt className="text-xs text-muted-foreground">Last Observation</dt>
              <dd className="text-sm font-medium">{formatDate(history.lastObservation!)}</dd>
            </div>
          )}
          {hasValue(history.observationCount) && (
            <div className="rounded-md bg-muted/40 p-3">
              <dt className="text-xs text-muted-foreground">Observations</dt>
              <dd className="text-sm font-medium">{formatCompactNumber(history.observationCount!)}</dd>
            </div>
          )}
        </dl>

        {hasValue(history.lastUpdatedAt) && (
          <p className="text-xs text-muted-foreground border-t border-border/60 pt-3">
            Last updated: {formatDate(history.lastUpdatedAt!)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}