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
import { useIndicatorCatalogue } from "@/hooks/use-indicator-catalogue";
import { useIndicatorData } from "@/hooks/use-indicator-data";
import { getApiErrorMessage } from "@/lib/api-error";
import { buildIndicatorMetricCards } from "@/lib/indicator-metrics";
import type { IndicatorCardMetric } from "@/lib/indicator-metrics";
import { cn } from "@/lib/utils";
import type { IndicatorCatalogueEntry, IndicatorDataItem } from "@/types";

/**
 * Preferred reading order for the catalogue domains. Unknown domains are
 * appended alphabetically so a new backend domain still appears.
 */
const DOMAIN_ORDER = [
  "Macroeconomics",
  "Financial Markets",
  "Crypto",
  "Commodities",
  "Foreign Exchange",
];

interface CategoryGroup {
  name: string;
  indicators: IndicatorCatalogueEntry[];
}

interface ExplorerCard {
  key: string;
  item: IndicatorDataItem;
  metric?: IndicatorCardMetric;
}

interface DomainGroup {
  name: string;
  categories: CategoryGroup[];
  indicatorCount: number;
}

function buildDomains(
  entries: readonly IndicatorCatalogueEntry[]
): DomainGroup[] {
  const byDomain = new Map<string, Map<string, IndicatorCatalogueEntry[]>>();

  for (const entry of entries) {
    let categories = byDomain.get(entry.domain);

    if (!categories) {
      categories = new Map();
      byDomain.set(entry.domain, categories);
    }

    const indicators = categories.get(entry.category);

    if (indicators) {
      indicators.push(entry);
    } else {
      categories.set(entry.category, [entry]);
    }
  }

  return [...byDomain.entries()]
    .sort((a, b) => {
      const aIndex = DOMAIN_ORDER.indexOf(a[0]);
      const bIndex = DOMAIN_ORDER.indexOf(b[0]);

      if (aIndex !== -1 || bIndex !== -1) {
        return (
          (aIndex === -1 ? DOMAIN_ORDER.length : aIndex) -
          (bIndex === -1 ? DOMAIN_ORDER.length : bIndex)
        );
      }

      return a[0].localeCompare(b[0]);
    })
    .map(([name, categories]) => {
      const groups = [...categories.entries()].map(
        ([categoryName, indicators]) => ({
          name: categoryName,
          indicators,
        })
      );

      return {
        name,
        categories: groups,
        indicatorCount: groups.reduce(
          (total, group) => total + group.indicators.length,
          0
        ),
      };
    });
}

function isIndicatorItem(
  item: IndicatorDataItem | undefined
): item is IndicatorDataItem {
  return Boolean(item);
}

function TabCount({
  count,
  isActive,
}: {
  count: number;
  isActive: boolean;
}) {
  return (
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
  );
}

/**
 * Two-level indicator browser: catalogue domains on top, the categories inside
 * the active domain underneath. Only the active category's ids are requested,
 * which keeps each batch well below the backend's 25-indicator limit.
 */
export function IndicatorExplorer() {
  const catalogue = useIndicatorCatalogue();
  const domains = useMemo(
    () => buildDomains(catalogue.data?.indicators ?? []),
    [catalogue.data]
  );

  const [selection, setSelection] = useState<{
    domain: string;
    category: string;
  } | null>(null);

  const activeDomain =
    domains.find((domain) => domain.name === selection?.domain) ?? domains[0];

  const activeCategory =
    activeDomain?.categories.find(
      (category) => category.name === selection?.category
    ) ?? activeDomain?.categories[0];

  const indicatorIds = useMemo(
    () => activeCategory?.indicators.map((entry) => entry.id) ?? [],
    [activeCategory]
  );

  const { data, isLoading, error } = useIndicatorData({
    indicators: indicatorIds,
    historyLimit: 250,
  });

  const itemsById = useMemo(
    () =>
      new Map(
        (data?.indicators ?? []).map((item) => [item.indicator.id, item])
      ),
    [data]
  );

  const visibleItems = useMemo(
    () =>
      (activeCategory?.indicators ?? [])
        .map((entry) => itemsById.get(entry.id))
        .filter(isIndicatorItem),
    [activeCategory, itemsById]
  );

  /**
   * Multi-column sources are expanded into one focused card per measurement
   * (CFTC participant groups, Binance positioning buckets, CoinMarketCap
   * market groups). Other indicators keep their single card.
   */
  const visibleCards = useMemo<ExplorerCard[]>(
    () =>
      visibleItems.flatMap<ExplorerCard>((item) => {
        const expanded = buildIndicatorMetricCards(item);

        if (expanded.length > 0) {
          return expanded.map(({ key, item: cardItem, metric }) => ({
            key,
            item: cardItem,
            metric,
          }));
        }

        return [{ key: item.indicator.id, item, metric: undefined }];
      }),
    [visibleItems]
  );

  const availableCount = indicatorIds.filter((id) =>
    itemsById.has(id)
  ).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <BarChart3 className="size-3" />
            Indicator catalogue
          </Badge>

          {catalogue.data && (
            <span className="text-xs text-muted-foreground">
              {catalogue.data.count} indicators · {domains.length} domains
            </span>
          )}
        </div>

        <CardTitle className="mt-1 text-xl leading-snug sm:text-2xl">
          Explore indicators
        </CardTitle>

        <CardDescription>
          Switch domain, then category, to inspect the latest stored readings.
          Multi-part sources are split into focused cards, and values are not
          filtered by the briefing date.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {catalogue.isLoading && (
          <div className="space-y-3" role="status" aria-label="Loading indicator catalogue">
            <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
            <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card
                  key={index}
                  className="h-[280px] animate-pulse bg-muted/30"
                />
              ))}
            </div>
          </div>
        )}

        {!catalogue.isLoading && catalogue.error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
            <p className="text-sm font-medium text-destructive">
              Could not load the indicator catalogue
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {getApiErrorMessage(
                catalogue.error,
                "Please try again in a moment."
              )}
            </p>
          </div>
        )}

        {!catalogue.isLoading && !catalogue.error && domains.length > 0 && (
          <>
            <div
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label="Indicator domains"
            >
              {domains.map((domain) => {
                const isActive = domain.name === activeDomain?.name;

                return (
                  <Button
                    key={domain.name}
                    type="button"
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    aria-pressed={isActive}
                    onClick={() =>
                      setSelection({
                        domain: domain.name,
                        category: domain.categories[0]?.name ?? "",
                      })
                    }
                    className="h-auto max-w-full whitespace-normal py-1"
                  >
                    {domain.name}
                    <TabCount
                      count={domain.indicatorCount}
                      isActive={isActive}
                    />
                  </Button>
                );
              })}
            </div>

            {activeDomain && (
              <div
                className="flex flex-wrap gap-1.5 rounded-lg border bg-muted/20 p-2"
                role="group"
                aria-label={`${activeDomain.name} categories`}
              >
                {activeDomain.categories.map((category) => {
                  const isActive = category.name === activeCategory?.name;

                  return (
                    <Button
                      key={category.name}
                      type="button"
                      size="sm"
                      variant={isActive ? "secondary" : "ghost"}
                      aria-pressed={isActive}
                      onClick={() =>
                        setSelection({
                          domain: activeDomain.name,
                          category: category.name,
                        })
                      }
                      className={cn(
                        "h-auto max-w-full whitespace-normal py-1 text-xs",
                        isActive && "ring-1 ring-border"
                      )}
                    >
                      {category.name}
                      <span
                        className={cn(
                          "rounded-full px-1 text-[10px] tabular-nums",
                          isActive
                            ? "bg-foreground/10 text-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {category.indicators.length}
                      </span>
                    </Button>
                  );
                })}
              </div>
            )}

            {activeDomain && activeCategory && (
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold">
                    {activeDomain.name}
                    <span className="text-muted-foreground"> / </span>
                    {activeCategory.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Latest stored readings for this category.
                  </p>
                </div>

                <span className="text-xs tabular-nums text-muted-foreground">
                  {isLoading
                    ? "Loading…"
                    : error || !data
                      ? null
                      : visibleCards.length > activeCategory.indicators.length
                        ? `${visibleCards.length} readings · ${availableCount} of ${activeCategory.indicators.length} indicators`
                        : `${availableCount} of ${activeCategory.indicators.length} available`}
                </span>
              </div>
            )}

            {isLoading && (
              <div
                className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                role="status"
                aria-label="Loading indicator readings"
              >
                {Array.from({ length: 4 }).map((_, index) => (
                  <Card
                    key={index}
                    className="h-[280px] animate-pulse bg-muted/30"
                  />
                ))}
              </div>
            )}

            {!isLoading && error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                <p className="text-sm font-medium text-destructive">
                  Could not load these indicators
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
                      {data.missing.length} indicator
                      {data.missing.length === 1 ? " is" : "s are"} not
                      available yet: {data.missing.join(", ")}.
                    </span>
                  </div>
                )}

                {visibleCards.length > 0 ? (
                  <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {visibleCards.map(({ key, item, metric }) => (
                      <div key={key} className="min-w-0">
                        <IndicatorCard item={item} metric={metric} />
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
          </>
        )}

        {!catalogue.isLoading && !catalogue.error && domains.length === 0 && (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            The indicator catalogue is empty.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
