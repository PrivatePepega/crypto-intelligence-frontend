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
import type { IndicatorCardMetric } from "@/lib/indicator-metrics";
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
  /**
   * Optional single-reading view. Multi-column sources (CFTC, Binance,
   * CoinMarketCap) use it to render one focused card per measurement.
   */
  metric?: IndicatorCardMetric;
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

function formatSignedValue(
  value: number | null,
  format: (value: number | null) => string
): string {
  if (value === null) return "—";
  return `${value > 0 ? "+" : ""}${format(value)}`;
}

export function IndicatorCard({ item, metric }: IndicatorCardProps) {
  const { indicator } = item;
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showPopover, setShowPopover] = React.useState(false);
  const [showChart, setShowChart] = React.useState(false);

  const historicalSeries = React.useMemo(() => getHistoricalSeries(item), [item]);

  const format = React.useCallback(
    (value: number | null) =>
      metric ? metric.formatValue(value) : formatValue(value, indicator.unit),
    [indicator.unit, metric]
  );
  const chartValueFormatter = React.useCallback(
    (value: number) => format(value),
    [format]
  );

  const unitLabel = metric?.unitLabel ?? indicator.unit;
  const title = metric?.label ?? indicator.name;
  const components = metric?.components ?? [];
  const hasComponents = components.length > 0;

  const currentValue = getCurrentValue(item);
  const netChange1M = calculateNetChangeForPeriod(item, "1M");

  return (
    <div className="relative flex flex-col self-start">
      <Card
        className={cn(
          "flex flex-col gap-3 p-4",
          !hasComponents && !isExpanded && "h-[280px]"
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
                  <DialogTitle>{title}</DialogTitle>

                  <DialogDescription className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {metric && (
                      <span className="w-full text-xs font-medium text-foreground/80">
                        {indicator.name}
                      </span>
                    )}

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
                    {format(currentValue)}
                  </span>

                  {unitLabel && (
                    <span className="text-sm text-muted-foreground">
                      {unitLabel}
                    </span>
                  )}
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
                      } · scroll or pinch to zoom, drag to pan, double-click an axis to reset`
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

                  <h4 className="text-sm font-semibold">{title}</h4>

                  {metric && (
                    <>
                      <p className="text-[11px] font-medium text-foreground/80">
                        {indicator.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {metric.subtitle}
                      </p>
                    </>
                  )}

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

        {/* Indicator name / focused metric title */}
        <div>
          {metric && (
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {indicator.name}
            </p>
          )}

          <h3 className="break-words text-xl font-bold leading-snug">
            {title}
          </h3>

          {metric && (
            <p className="mt-1 text-xs leading-snug text-muted-foreground">
              {metric.subtitle}
            </p>
          )}
        </div>

        {/* Flexible middle section: price anchored above the divider */}
        <div className="flex flex-1 flex-col justify-end gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-4xl font-extrabold tracking-tight tabular-nums">
                {format(currentValue)}
              </span>

              {unitLabel && (
                <span className="text-sm text-muted-foreground">{unitLabel}</span>
              )}
            </div>
          </div>

          {hasComponents && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {components.map((component) => (
                <div key={component.label} className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {component.label}
                  </p>

                  <div className="flex flex-wrap items-baseline gap-x-1.5">
                    <span className="break-words text-sm font-semibold tabular-nums text-foreground">
                      {component.formatValue(component.value)}
                    </span>

                    {component.deltaPercent !== null && (
                      <span
                        className={cn(
                          "text-[10px] font-medium tabular-nums",
                          getChangeClass(component.deltaPercent)
                        )}
                      >
                        {formatSignedValue(
                          component.deltaPercent,
                          (value) => `${value?.toFixed(1) ?? "—"}%`
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t" />
        </div>

        {/* Bottom statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              1M MA
            </p>

            <span className="break-words text-lg font-bold text-foreground">
              {format(calculateSMAForPeriod(item, "1M"))}
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
              {formatSignedValue(netChange1M, format)}
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
                          {format(calculateSMAForPeriod(item, period))}
                        </p>
                      </div>

                      <div className="flex min-h-8 min-w-0 items-center justify-center text-center">
                        <p
                          className={cn(
                            "break-words text-xs font-semibold tabular-nums",
                            changeClass
                          )}
                        >
                          {formatSignedValue(net, format)}
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
