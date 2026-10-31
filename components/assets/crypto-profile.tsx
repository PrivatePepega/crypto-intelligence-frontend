import Image from "next/image";
import { Globe, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { CryptoAssetResponse } from "@/lib/asset-api";
import {
  formatDate,
  formatMoney,
  formatPercent,
  formatSignedMoney,
  hasValue,
} from "@/lib/asset-format";
import { cn } from "@/lib/utils";

type CryptoProfileProps = {
  data: CryptoAssetResponse;
};

/**
 * Identity and price header for a crypto asset: logo, name, symbol, price, change, and description.
 */
export function CryptoProfile({ data }: CryptoProfileProps) {
  const { asset, market } = data;
  const currency = market.currency;
  const hasChange = market.change24h !== null || market.changePercent24h !== null;
  const isPositive = (market.change24h ?? 0) >= 0;
  const asOf = market.priceUpdatedAt ?? data.dataUpdatedAt;

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="flex min-w-0 items-start gap-3">
            {asset.logoUrl ? (
              <Image
                src={asset.logoUrl}
                alt={`${asset.name} logo`}
                width={56}
                height={56}
                priority
                className="size-14 shrink-0 rounded-xl bg-white object-contain p-1 ring-1 ring-foreground/10"
              />
            ) : (
              <div
                aria-hidden
                className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-muted text-lg font-semibold text-muted-foreground"
              >
                {asset.symbol.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-2xl leading-tight font-semibold tracking-tight">
                  {asset.name}
                </h1>
                <Badge variant="secondary">{asset.symbol.toUpperCase()}</Badge>
                <Badge variant="outline">Crypto</Badge>
              </div>

              {asset.category && (
                <p className="text-xs text-muted-foreground">{asset.category}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start gap-1 sm:items-end">
            <span className="text-3xl font-semibold tracking-tight tabular-nums">
              {formatMoney(market.price, currency)}
            </span>

            {hasChange && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-sm font-medium tabular-nums",
                  isPositive ? "text-emerald-500" : "text-destructive"
                )}
              >
                {formatSignedMoney(market.change24h, currency)}
                {market.changePercent24h !== null && (
                  <span>({formatPercent(market.changePercent24h)})</span>
                )}
              </span>
            )}

            {asOf && (
              <span className="text-xs text-muted-foreground">
                As of {formatDate(asOf)}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      {asset.description && (
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground lg:columns-2 lg:gap-10">
            {asset.description}
          </p>
        </CardContent>
      )}

      {(asset.website || data.dataUpdatedAt) && (
        <CardContent className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          {asset.website ? (
            <a
              href={asset.website}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              <Globe className="size-3.5" aria-hidden />
              {asset.website.replace(/^https?:\/\//i, "").replace(/\/$/, "")}
              <ExternalLink className="size-3" aria-hidden />
            </a>
          ) : (
            <span>No website stored</span>
          )}

          {data.dataUpdatedAt && (
            <span>Data updated {formatDate(data.dataUpdatedAt)}</span>
          )}
        </CardContent>
      )}
    </Card>
  );
}