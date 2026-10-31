import Image from "next/image";
import { ArrowDownRight, ArrowUpRight, ExternalLink, Globe } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { StockAssetResponse } from "@/lib/asset-api";
import {
  formatDate,
  formatMoney,
  formatPercent,
  formatSignedMoney,
  hasValue,
} from "@/lib/asset-format";
import { cn } from "@/lib/utils";

type StockProfileProps = {
  data: StockAssetResponse;
};

function websiteLabel(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

/**
 * Identity and price header for a stock: who the company is, what it trades at
 * right now, and the provider's company description.
 */
export function StockProfile({ data }: StockProfileProps) {
  const { company, market } = data;
  const currency = company.currency;
  const hasChange = market.change !== null || market.changePercent !== null;
  const isPositive = (market.change ?? 0) >= 0;
  const ChangeIcon = isPositive ? ArrowUpRight : ArrowDownRight;
  const asOf = market.priceUpdatedAt ?? data.dataUpdatedAt;
  const meta = [company.exchange, company.sector, company.industry].filter(
    hasValue
  );

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="flex min-w-0 items-start gap-3">
            {company.logoUrl ? (
              <Image
                src={company.logoUrl}
                alt={`${company.name} logo`}
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
                {company.name.slice(0, 1)}
              </div>
            )}

            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-2xl leading-tight font-semibold tracking-tight">
                  {company.name}
                </h1>
                <Badge variant="secondary">{data.ticker}</Badge>
                <Badge variant="outline">Stock</Badge>
              </div>

              {meta.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {meta.join(" · ")}
                </p>
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
                <ChangeIcon className="size-4" aria-hidden />
                {formatSignedMoney(market.change, currency)}
                {market.changePercent !== null && (
                  <span>({formatPercent(market.changePercent)})</span>
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

      {company.description && (
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground lg:columns-2 lg:gap-10">
            {company.description}
          </p>
        </CardContent>
      )}

      {(company.website || data.dataUpdatedAt) && (
        <CardContent className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          {company.website ? (
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              <Globe className="size-3.5" aria-hidden />
              {websiteLabel(company.website)}
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
