"use client";

import React from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import type { IndicatorDataItem } from "@/types";
import {
  getCurrentValue,
  formatValue,
  calculateSMAForPeriod,
  calculateNetChangeForPeriod,
} from "@/hooks/use-indicator-data";
import { cn } from "@/lib/utils";

interface IndicatorCardProps {
  item: IndicatorDataItem;
}

export function IndicatorCard({ item }: IndicatorCardProps) {
  const { indicator } = item;
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showPopover, setShowPopover] = React.useState(false);

  return (
    <div className="relative">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                <Badge variant="outline" className="text-[10px] font-medium py-0.5 px-1.5">
                  {indicator.domain}
                </Badge>
                <span className="text-xs text-muted-foreground">/</span>
                <Badge variant="secondary" className="text-xs whitespace-nowrap py-0.5 px-2">
                  {indicator.category}
                </Badge>
              </div>
              <h3 className="text-lg font-semibold break-words mb-0">{indicator.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Popover open={showPopover} onOpenChange={setShowPopover}>
                <PopoverTrigger>
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent transition-colors"
                    aria-label="Indicator details"
                  >
                    <HelpCircle className="size-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80">
                  <div className="space-y-4 p-1">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-2">
                        <Badge variant="outline" className="text-[10px] font-medium py-0.5 px-1.5">
                          {indicator.domain}
                        </Badge>
                        <span className="text-xs text-muted-foreground">/</span>
                        <Badge variant="secondary" className="text-xs whitespace-nowrap py-0.5 px-2">
                          {indicator.category}
                        </Badge>
                      </div>
                      <h4 className="mt-1 text-sm font-semibold text-foreground">
                        {indicator.name}
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Source: {indicator.source} · {indicator.nativeFrequency}
                      </p>
                    </div>
                    <div className="space-y-3 pt-3 border-t">
                      {indicator.description && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Description
                          </p>
                          <p className="text-sm text-foreground">{indicator.description}</p>
                        </div>
                      )}
                      {indicator.use && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Use Case
                          </p>
                          <p className="text-sm text-foreground">{indicator.use}</p>
                        </div>
                      )}
                      {indicator.purpose && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Purpose
                          </p>
                          <p className="text-sm text-foreground">{indicator.purpose}</p>
                        </div>
                      )}
                      {indicator.significance && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Significance
                          </p>
                          <p className="text-sm text-foreground">{indicator.significance}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent transition-colors"
                aria-label="Expand details"
                aria-expanded={isExpanded}
              >
                <ChevronDown className={cn("size-4 transition-transform duration-200", isExpanded && "rotate-180")} />
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-3 pt-0">
          {/* Current Value */}
          <div className="mb-0">
            <span className="text-3xl font-bold tabular-nums">{formatValue(getCurrentValue(item), item.indicator.unit)}</span>
            <p className="text-xs text-muted-foreground mt-0.5">{item.indicator.unit}</p>
          </div>

          {/* Divider */}
          <div className="border-t mb-1" />

          {/* 1M MA and Net Change - Vertical Layout */}
          <div className="grid grid-cols-2 gap-2 mb-0">
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">1M MA</span>
              <span className="font-semibold tabular-nums text-foreground text-lg">
                {formatValue(calculateSMAForPeriod(item, "1M"), item.indicator.unit)}
              </span>
            </div>
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Net Change</span>
              <span className={cn(
                "font-semibold tabular-nums",
                (() => {
                  const net = calculateNetChangeForPeriod(item, "1M");
                  if (net === null) return "text-muted-foreground";
                  return net > 0 ? "text-green-600 dark:text-green-400" : net < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground";
                })()
              )}>
                {(() => {
                  const net = calculateNetChangeForPeriod(item, "1M");
                  if (net === null) return "—";
                  return (net > 0 ? "+" : "") + formatValue(net, item.indicator.unit);
                })()}
              </span>
            </div>
          </div>

          {/* Expandable detailed table */}
          {isExpanded && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm" role="table">
                <thead>
                  <tr className="border-b border-muted">
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Period
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      MA
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Net Change
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      % Change
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(["2W", "1M", "3M", "6M", "12M", "24M"] as const).map((period) => {
                    const net = calculateNetChangeForPeriod(item, period);
                    return (
                      <tr key={period} className="border-b border-muted/50 hover:bg-muted/30">
                        <td className="py-2 px-3 text-xs font-medium text-foreground">
                          {period}
                        </td>
                        <td className="py-2 px-3 text-xs text-right tabular-nums text-foreground">
                          {formatValue(calculateSMAForPeriod(item, period), item.indicator.unit)}
                        </td>
                        <td className="py-2 px-3 text-xs text-right tabular-nums">
                          <span className={cn("font-semibold", net !== null && net > 0 ? "text-green-600 dark:text-green-400" : net !== null && net < 0 ? "text-red-600 dark:text-red-400" : "text-foreground")}>
                            {net !== null ? (net > 0 ? "+" : "") + formatValue(net, item.indicator.unit) : "—"}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-xs text-right tabular-nums">
                          <span className={cn("font-semibold", net !== null && net > 0 ? "text-green-600 dark:text-green-400" : net !== null && net < 0 ? "text-red-600 dark:text-red-400" : "text-foreground")}>
                            {net !== null ? (net > 0 ? "+" : "") + (net / Math.abs(getCurrentValue(item) || 1) * 100).toFixed(2) + "%" : "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}

export function IndicatorCardCompact({ item }: { item: IndicatorDataItem }) {
  const { indicator, current } = item;
  const currentValue = getCurrentValue(item);
  const formattedCurrent = formatValue(currentValue, indicator.unit);

  return (
    <div className="p-4 bg-card border rounded-xl hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h4 className="font-semibold truncate">{indicator.name}</h4>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-muted-foreground">{indicator.domain}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{indicator.category}</span>
          </div>
        </div>
        <span className="text-2xl font-bold tabular-nums">{formattedCurrent}</span>
      </div>
      <div className="text-xs text-muted-foreground">{indicator.unit}</div>
    </div>
  );
}