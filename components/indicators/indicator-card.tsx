"use client";

import React from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
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
    <div className="relative flex flex-col self-start">
      <Card className="flex min-h-[280px] flex-col gap-3 p-4">
        {/* Metadata and actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className="px-1.5 py-0 text-[10px] font-medium"
            >
              {indicator.domain}
            </Badge>

            <span className="text-xs text-muted-foreground">/</span>

            <Badge
              variant="secondary"
              className="whitespace-nowrap px-1.5 py-0 text-xs"
            >
              {indicator.category}
            </Badge>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Popover open={showPopover} onOpenChange={setShowPopover}>
              <PopoverTrigger>
                <button
                  type="button"
                  className="flex size-7 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-accent hover:text-muted-foreground"
                  aria-label="Indicator details"
                >
                  <HelpCircle className="size-4" />
                </button>
              </PopoverTrigger>

              <PopoverContent align="end" className="w-72" side="bottom">
                <div className="space-y-3 p-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px]">
                      {indicator.domain}
                    </Badge>

                    <span>/</span>

                    <Badge variant="secondary" className="text-xs">
                      {indicator.category}
                    </Badge>
                  </div>

                  <h4 className="text-sm font-semibold">
                    {indicator.name}
                  </h4>

                  <p className="text-xs text-muted-foreground">
                    Source: {indicator.source} · {indicator.nativeFrequency}
                  </p>

                  <div className="space-y-2 border-t pt-3">
                    {indicator.description && (
                      <p className="text-xs">
                        <strong>Description:</strong> {indicator.description}
                      </p>
                    )}

                    {indicator.use && (
                      <p className="text-xs">
                        <strong>Use:</strong> {indicator.use}
                      </p>
                    )}

                    {indicator.purpose && (
                      <p className="text-xs">
                        <strong>Purpose:</strong> {indicator.purpose}
                      </p>
                    )}

                    {indicator.significance && (
                      <p className="text-xs">
                        <strong>Significance:</strong>{" "}
                        {indicator.significance}
                      </p>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-accent hover:text-muted-foreground"
              aria-label="Expand details"
              aria-expanded={isExpanded}
            >
              <ChevronDown
                className={cn(
                  "size-4 transition-transform duration-200",
                  isExpanded && "rotate-180"
                )}
              />
            </button>
          </div>
        </div>

        {/* Indicator name */}
        <h3 className="break-words text-xl font-bold leading-snug">
          {indicator.name}
        </h3>

        {/* Flexible middle section: price anchored above the divider */}
        <div className="flex flex-1 flex-col justify-end gap-4">
          {/* Current value */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-4xl font-extrabold tracking-tight tabular-nums">
                {formatValue(getCurrentValue(item), indicator.unit)}
              </span>

              <span className="text-sm text-muted-foreground">
                {indicator.unit}
              </span>
            </div>
          </div>

          {/* Divider directly below current value */}
          <div className="border-t" />
        </div>

        {/* Bottom statistics */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                1M MA
              </p>

              <span className="break-words text-lg font-bold text-foreground">
                {formatValue(
                  calculateSMAForPeriod(item, "1M"),
                  indicator.unit
                )}
              </span>
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Net Change
              </p>

              {(() => {
                const net = calculateNetChangeForPeriod(item, "1M");

                return (
                  <span
                    className={cn(
                      "break-words text-lg font-semibold tabular-nums",
                      net === null || net === 0
                        ? "text-muted-foreground"
                        : net > 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {net === null
                      ? "—"
                      : `${net > 0 ? "+" : ""}${formatValue(net, indicator.unit)}`}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Expandable historical statistics */}
        {isExpanded && (
          <div className="overflow-x-auto border-t pt-3">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-muted">
                  <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Period
                  </th>

                  <th className="px-2 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    MA
                  </th>

                  <th className="px-2 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Net Change
                  </th>

                  <th className="px-2 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    % Change
                  </th>
                </tr>
              </thead>

              <tbody>
                {(["2W", "1M", "3M", "6M", "12M", "24M"] as const).map(
                  (period) => {
                    const net = calculateNetChangeForPeriod(item, period);
                    const currentValue = getCurrentValue(item);
                    const percentChange =
                      net === null || currentValue === 0
                        ? null
                        : (net / Math.abs(currentValue)) * 100;

                    const changeClass =
                      net === null || net === 0
                        ? "text-muted-foreground"
                        : net > 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400";

                    return (
                      <tr
                        key={period}
                        className="border-b border-muted/50 hover:bg-muted/30"
                      >
                        <td className="px-2 py-2 text-xs font-medium text-foreground">
                          {period}
                        </td>

                        <td className="px-2 py-2 text-right text-xs tabular-nums text-foreground">
                          {formatValue(
                            calculateSMAForPeriod(item, period),
                            indicator.unit
                          )}
                        </td>

                        <td className="px-2 py-2 text-right text-xs tabular-nums">
                          <span className={cn("font-semibold", changeClass)}>
                            {net === null
                              ? "—"
                              : `${net > 0 ? "+" : ""}${formatValue(net, indicator.unit)}`}
                          </span>
                        </td>

                        <td className="px-2 py-2 text-right text-xs tabular-nums">
                          <span className={cn("font-semibold", changeClass)}>
                            {percentChange === null
                              ? "—"
                              : `${percentChange > 0 ? "+" : ""}${percentChange.toFixed(2)}%`}
                          </span>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}