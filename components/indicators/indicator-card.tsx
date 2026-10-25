"use client";

import React from "react";
import { ChartLine, ChevronDown, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AreaChart } from "@/components/indicators/areaChart";
import type { IndicatorDataItem } from "@/types";
import {
  calculateNetChangeForPeriod,
  calculateSMAForPeriod,
  formatValue,
  getCurrentValue,
  getHistoricalSeries,
} from "@/hooks/use-indicator-data";
import { cn } from "@/lib/utils";

interface IndicatorCardProps {
  item: IndicatorDataItem;
}

const HISTORY_PERIODS = [
  { value: "2W", label: "2 Weeks" },
  { value: "1M", label: "1 Month" },
  { value: "3M", label: "3 Months" },
  { value: "6M", label: "6 Months" },
  { value: "12M", label: "12 Months" },
  { value: "24M", label: "24 Months" },
] as const;

function getChangeClass(change: number | null): string {
  if (change === null || change === 0) return "text-muted-foreground";
  return change > 0
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";
}

function formatSignedValue(value: number | null, unit: string): string {
  if (value === null) return "—";
  return `${value > 0 ? "+" : ""}${formatValue(value, unit)}`;
}

export function IndicatorCard({ item }: IndicatorCardProps) {
  const { indicator } = item;
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showPopover, setShowPopover] = React.useState(false);
  const [showChart, setShowChart] = React.useState(false);

  const historicalSeries = React.useMemo(() => getHistoricalSeries(item), [item]);
  const chartValueFormatter = React.useCallback(
    (value: number) => formatValue(value, indicator.unit),
    [indicator.unit]
  );

  const currentValue = getCurrentValue(item);
  const netChange1M = calculateNetChangeForPeriod(item, "1M");

  return (
    <div className="relative flex flex-col self-start">
      <Card
        className={cn(
          "flex flex-col gap-3 p-4",
          isExpanded ? "min-h-[280px]" : "h-[280px]"
        )}
      >
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
            <Dialog open={showChart} onOpenChange={setShowChart}>
              <DialogTrigger
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-accent hover:text-muted-foreground"
                aria-label="View historical chart"
              >
                <ChartLine className="size-4" />
              </DialogTrigger>

              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{indicator.name}</DialogTitle>

                  <DialogDescription className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <Badge
                      variant="outline"
                      className="px-1.5 py-0 text-[10px] font-medium"
                    >
                      {indicator.domain}
                    </Badge>

                    <span>/</span>

                    <Badge
                      variant="secondary"
                      className="px-1.5 py-0 text-[10px] font-medium"
                    >
                      {indicator.category}
                    </Badge>

                    <span>
                      {indicator.source} · {indicator.nativeFrequency}
                    </span>
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-3xl font-extrabold tracking-tight tabular-nums">
                    {formatValue(currentValue, indicator.unit)}
                  </span>

                  <span className="text-sm text-muted-foreground">
                    {indicator.unit}
                  </span>
                </div>

                <AreaChart
                  data={historicalSeries}
                  valueFormatter={chartValueFormatter}
                  height={360}
                />

                <p className="text-[10px] text-muted-foreground">
                  {historicalSeries.length > 0
                    ? `${historicalSeries.length} observation${
                        historicalSeries.length === 1 ? "" : "s"
                      } · drag to pan, scroll over the scale to zoom`
                    : "No historical observations available for this indicator"}
                </p>
              </DialogContent>
            </Dialog>

            <Popover open={showPopover} onOpenChange={setShowPopover}>
              <PopoverTrigger
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-accent hover:text-muted-foreground"
                aria-label="Indicator details"
              >
                <HelpCircle className="size-4" />
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

                  <h4 className="text-sm font-semibold">{indicator.name}</h4>

                  <p className="text-xs text-muted-foreground">
                    Source: {indicator.source} · {indicator.nativeFrequency}
                  </p>

                  <div className="space-y-3 border-t pt-3">
                    {indicator.description && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-white">
                          Description
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {indicator.description}
                        </p>
                      </div>
                    )}

                    {indicator.use && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-white">Use</p>
                        <p className="text-xs text-muted-foreground">
                          {indicator.use}
                        </p>
                      </div>
                    )}

                    {indicator.purpose && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-white">
                          Purpose
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {indicator.purpose}
                        </p>
                      </div>
                    )}

                    {indicator.significance && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-white">
                          Significance
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {indicator.significance}
                        </p>
                      </div>
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
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-4xl font-extrabold tracking-tight tabular-nums">
                {formatValue(currentValue, indicator.unit)}
              </span>

              <span className="text-sm text-muted-foreground">
                {indicator.unit}
              </span>
            </div>
          </div>

          <div className="border-t" />
        </div>

        {/* Bottom statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              1M MA
            </p>

            <span className="break-words text-lg font-bold text-foreground">
              {formatValue(calculateSMAForPeriod(item, "1M"), indicator.unit)}
            </span>
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Net Change
            </p>

            <span
              className={cn(
                "break-words text-lg font-semibold tabular-nums",
                getChangeClass(netChange1M)
              )}
            >
              {formatSignedValue(netChange1M, indicator.unit)}
            </span>
          </div>
        </div>

        {/* Expandable historical statistics */}
        {isExpanded && (
          <div className="border-t pt-4">
            <div className="space-y-3">
              {HISTORY_PERIODS.map(({ value: period, label }) => {
                const net = calculateNetChangeForPeriod(item, period);

                const percentChange =
                  net === null || currentValue === null || currentValue === 0
                    ? null
                    : (net / Math.abs(currentValue)) * 100;

                const changeClass = getChangeClass(net);

                return (
                  <div key={period} className="space-y-0">
                    {/* One header box: timeframe on top, labels underneath */}
                    <div className="overflow-hidden rounded-t-lg border border-border/60">
                      <div className="bg-muted/70 px-3 pt-2">
                        <span className="text-xs font-semibold tracking-wide text-foreground">
                          {label}
                        </span>

                        <div className="grid grid-cols-3 items-center justify-center gap-2">
                          <p className="text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            MA
                          </p>
                          <p className="text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Net Change
                          </p>
                          <p className="text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            % Change
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Separate box: values only */}
                    <div className="grid grid-cols-3 items-center gap-2 rounded-b-lg border border-t-0 border-border/60 px-3 py-3">
                      <div className="flex min-h-8 min-w-0 items-center justify-center text-center">
                        <p className="break-words text-xs tabular-nums text-muted-foreground">
                          {formatValue(
                            calculateSMAForPeriod(item, period),
                            indicator.unit
                          )}
                        </p>
                      </div>

                      <div className="flex min-h-8 min-w-0 items-center justify-center text-center">
                        <p
                          className={cn(
                            "break-words text-xs font-semibold tabular-nums",
                            changeClass
                          )}
                        >
                          {formatSignedValue(net, indicator.unit)}
                        </p>
                      </div>

                      <div className="flex min-h-8 min-w-0 items-center justify-center text-center">
                        <p
                          className={cn(
                            "break-words text-xs font-semibold tabular-nums",
                            changeClass
                          )}
                        >
                          {percentChange === null
                            ? "—"
                            : `${percentChange > 0 ? "+" : ""}${percentChange.toFixed(2)}%`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 border-t pt-3 text-[10px] text-muted-foreground">
              MA = Moving Average
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
