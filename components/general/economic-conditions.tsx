"use client";

import { useMemo, useState } from "react";
import { BarChart3, Info } from "lucide-react";

import { IndicatorCard } from "@/components/indicators/indicator-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useIndicatorData } from "@/hooks/use-indicator-data";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  ECONOMIC_INDICATOR_CATEGORIES,
  ECONOMIC_INDICATOR_IDS,
} from "@/lib/economic-indicators";
import { cn } from "@/lib/utils";
import type { IndicatorDataItem } from "@/types";

function isIndicatorItem(
  item: IndicatorDataItem | undefined
): item is IndicatorDataItem {
  return Boolean(item);
}

/**
 * The seven economic-condition groups from the General window. All indicators
 * are fetched once and the category buttons only filter the loaded response.
 */
export function EconomicConditions() {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    ECONOMIC_INDICATOR_CATEGORIES[0].id
  );

  const { data, isLoading, error } = useIndicatorData({
    indicators: ECONOMIC_INDICATOR_IDS,
    historyLimit: 250,
  });

  const itemsById = useMemo(
    () =>
      new Map(
        (data?.indicators ?? []).map((item) => [item.indicator.id, item])
      ),
    [data]
  );

  const activeCategory =
    ECONOMIC_INDICATOR_CATEGORIES.find(
      (category) => category.id === activeCategoryId
    ) ?? ECONOMIC_INDICATOR_CATEGORIES[0];

  const visibleItems = activeCategory.indicatorIds
    .map((id) => itemsById.get(id))
    .filter(isIndicatorItem);

  const availableCount = activeCategory.indicatorIds.filter((id) =>
    itemsById.has(id)
  ).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <BarChart3 className="size-3" />
            Economic indicators
          </Badge>

          {data && (
            <span className="text-xs text-muted-foreground">
              {data.found} of {ECONOMIC_INDICATOR_IDS.length} indicators loaded
            </span>
          )}
        </div>

        <CardTitle className="mt-1 text-xl leading-snug sm:text-2xl">
          Economic conditions
        </CardTitle>

        <CardDescription>
          Latest stored readings across inflation, labor, growth, consumers,
          housing, monetary policy, and activity. Indicator values are not
          filtered by the briefing date.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Economic indicator categories"
        >
          {ECONOMIC_INDICATOR_CATEGORIES.map((category) => {
            const count = category.indicatorIds.filter((id) =>
              itemsById.has(id)
            ).length;
            const isActive = category.id === activeCategory.id;

            return (
              <Button
                key={category.id}
                type="button"
                size="sm"
                variant={isActive ? "default" : "outline"}
                aria-pressed={isActive}
                onClick={() => setActiveCategoryId(category.id)}
                className="h-auto max-w-full whitespace-normal py-1"
              >
                {category.label}

                <span
                  className={cn(
                    "rounded-full px-1 text-[10px] tabular-nums",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </Button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">{activeCategory.label}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {activeCategory.description}
            </p>
          </div>

          <span className="text-xs tabular-nums text-muted-foreground">
            {availableCount} of {activeCategory.indicatorIds.length} available
          </span>
        </div>

        {isLoading && (
          <div
            className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
            role="status"
            aria-label="Loading economic indicators"
          >
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="h-[280px] animate-pulse bg-muted/30" />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
            <p className="text-sm font-medium text-destructive">
              Could not load the economic indicators
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {getApiErrorMessage(error, "Please try again in a moment.")}
            </p>
          </div>
        )}

        {!isLoading && !error && data && (
          <>
            {data.missing.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  {data.missing.length} configured indicator
                  {data.missing.length === 1 ? " is" : "s are"} not available
                  yet: {data.missing.join(", ")}.
                </span>
              </div>
            )}

            {visibleItems.length > 0 ? (
              <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {visibleItems.map((item) => (
                  <div key={item.indicator.id} className="min-w-0">
                    <IndicatorCard item={item} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No indicators are available for this category yet.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
