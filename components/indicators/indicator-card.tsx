"use client";

import React from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
  const net1M = calculateNetChangeForPeriod(item, "1M");
  const netClassName = net1M === null ? "text-muted-foreground" : net1M > 0 ? "text-green-600 dark:text-green-400" : net1M < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground";
  const netDisplay = net1M === null ? "—" : (net1M > 0 ? "+" : "") + formatValue(net1M, item.indicator.unit);
  const [showPopover, setShowPopover] = React.useState(false);

  return (
    <div className="relative h-full flex flex-col">
      <Card className="h-full flex flex-col">
        {/* Top meta row: badges + ? + arrow in their own box */}
        <div className="px-2 pt-0 pb-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="text-[10px] font-medium py-0 px-1.5">{indicator.domain}</Badge>
              <span className="text-xs text-muted-foreground">/</span>
              <Badge variant="secondary" className="text-xs whitespace-nowrap py-0 px-1.5">{indicator.category}</Badge>
            </div>
            <div className="flex items-center gap-1 shrink-0">
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
                <PopoverContent align="end" className="w-72" side="bottom">
                  <div className="space-y-3 p-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{indicator.domain}</Badge>
                      <span>/</span>
                      <Badge variant="secondary" className="text-xs">{indicator.category}</Badge>
                    </div>
                    <h4 className="text-sm font-semibold">{indicator.name}</h4>
                    <p className="text-xs text-muted-foreground">Source: {indicator.source} · {indicator.nativeFrequency}</p>
                    <div className="pt-2 border-t space-y-2">
                      {indicator.description && <p className="text-xs"><strong>Description:</strong> {indicator.description}</p>}
                      {indicator.use && <p className="text-xs"><strong>Use:</strong> {indicator.use}</p>}
                      {indicator.purpose && <p className="text-xs"><strong>Purpose:</strong> {indicator.purpose}</p>}
                      {indicator.significance && <p className="text-xs"><strong>Significance:</strong> {indicator.significance}</p>}
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
        </div>

        {/* Indicator name — full width, its own box */}
        <div className="px-2 pb-0 pt-0">
          <h3 className="text-xl font-bold break-words leading-snug">{indicator.name}</h3>
        </div>

        {/* Divider */}
        <div className="mx-4 border-t" />

        {/* Current Value — its own box */}
        <div className="px-2 pt-0 pb-0">
          <div>
            <span className="text-4xl font-extrabold tabular-nums tracking-tight">{formatValue(getCurrentValue(item), item.indicator.unit)}</span>
            <span className="text-sm text-muted-foreground ml-2">{item.indicator.unit}</span>
          </div>
        </div>

        {/* 1M MA and Net Change */}
        <div className="px-4 pb-0 pt-0">
          <div className="grid grid-cols-2 gap-0">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">1M MA</p>
              <span className="font-bold text-foreground text-lg">{formatValue(calculateSMAForPeriod(item, "1M"), item.indicator.unit)}</span>
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Net Change</p>
              <span className="font-semibold text-lg">{formatValue(calculateNetChangeForPeriod(item, "1M"), item.indicator.unit) || "—"}</span>
            </div>
          </div>
        </div>

        {/* Expandable table */}
        {isExpanded && (
          <div className="mx-4 mt-0 overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-muted">
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Period</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">MA</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Net Change</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">% Change</th>
                </tr>
              </thead>
              <tbody>
                {(["2W", "1M", "3M", "6M", "12M", "24M"] as const).map((period) => {
                  const net = calculateNetChangeForPeriod(item, period);
                  return (
                    <tr key={period} className="border-b border-muted/50 hover:bg-muted/30">
                      <td className="py-2 px-3 text-xs font-medium text-foreground">{period}</td>
                      <td className="py-2 px-3 text-xs text-right tabular-nums text-foreground">{formatValue(calculateSMAForPeriod(item, period), item.indicator.unit)}</td>
                      <td className="py-2 px-3 text-xs text-right tabular-nums">
                        <span className={cn("font-semibold", net !== null && net > 0 ? "text-green-600 dark:text-green-400" : net !== null && net < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground")}>
                          {net !== null ? (net > 0 ? "+" : "") + formatValue(net, item.indicator.unit) : "—"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs text-right tabular-nums">
                        <span className={cn("font-semibold", net !== null && net > 0 ? "text-green-600 dark:text-green-400" : net !== null && net < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground")}>
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
      </Card>
    </div>
  );
}

