"use client";

import { useMemo, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  ExternalLink,
  Eye,
  FlaskConical,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatBriefDate, formatBriefUpdatedAt } from "@/lib/brief-format";
import {
  RESEARCH_STATUS_LABELS,
  formatResearchToken,
  formatSourceLabel,
  getResearchStatusClass,
  isHttpUrl,
  parseResearchDetails,
  sortByMostRecent,
} from "@/lib/research";
import { cn } from "@/lib/utils";
import {
  getWeatherDomainLabel,
  type WeatherDomain,
} from "@/lib/weather-domains";
import type {
  WeatherObservationsResearchResponse,
  WeatherResearchEntry,
} from "@/types";

interface DomainIntelligenceProps {
  domain: WeatherDomain;
  data: WeatherObservationsResearchResponse | undefined;
  isLoading: boolean;
  error: unknown;
  /** True when the selected date had no rows and the latest set is shown. */
  isFallback?: boolean;
  /** Formatted selected date, used in the empty state. */
  dateLabel?: string | null;
  /** True when the request asked for the most recent data instead of a date. */
  latest?: boolean;
  icon?: ReactNode;
  /** Selects this domain in the full observations section. */
  onViewAll?: (domain: WeatherDomain) => void;
}

const MAX_RESEARCH = 2;
const MAX_OBSERVATIONS = 5;

function CompactSourceLinks({ sources }: { sources: string[] }) {
  const unique = [...new Set(sources.map((source) => source.trim()))]
    .filter(Boolean)
    .slice(0, 3);

  if (unique.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {unique.map((source, index) =>
        isHttpUrl(source) ? (
          <a
            key={`${source}-${index}`}
            href={source}
            target="_blank"
            rel="noreferrer noopener"
            title={source}
            className="inline-flex max-w-full items-center gap-1 rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-700 transition-colors hover:bg-sky-500/20 dark:text-sky-400"
          >
            <ExternalLink className="size-3 shrink-0" />
            <span className="truncate">{formatSourceLabel(source)}</span>
          </a>
        ) : (
          <Badge
            key={`${source}-${index}`}
            variant="outline"
            className="max-w-full whitespace-normal text-[10px]"
          >
            {source}
          </Badge>
        )
      )}
    </div>
  );
}

function CompactResearchCard({ entry }: { entry: WeatherResearchEntry }) {
  const details = parseResearchDetails(entry.research);
  const status = details?.status ?? "";
  const date = formatBriefDate(entry.date);

  return (
    <article className="rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="text-[10px]">
          {formatResearchToken(entry.type)}
        </Badge>

        {status && (
          <Badge
            variant="outline"
            className={cn("text-[10px]", getResearchStatusClass(status))}
          >
            {RESEARCH_STATUS_LABELS[status] ?? formatResearchToken(status)}
          </Badge>
        )}

        {date && <span className="text-[10px] text-muted-foreground">{date}</span>}
      </div>

      <p className="mt-2 text-sm font-medium leading-relaxed">
        {entry.observation}
      </p>

      {details?.finding && (
        <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
          {details.finding}
        </p>
      )}

      <CompactSourceLinks sources={details?.sources ?? []} />
    </article>
  );
}

export function DomainIntelligence({
  domain,
  data,
  isLoading,
  error,
  isFallback,
  dateLabel,
  latest,
  icon,
  onViewAll,
}: DomainIntelligenceProps) {
  const label = getWeatherDomainLabel(domain);

  const observations = useMemo(
    () =>
      sortByMostRecent(
        (data?.observations ?? []).filter(
          (row) => row.market_domain === domain
        )
      ),
    [data?.observations, domain]
  );

  const research = useMemo(
    () =>
      sortByMostRecent(
        (data?.research ?? []).filter((row) => row.market_domain === domain)
      ),
    [data?.research, domain]
  );

  const dates = useMemo(() => {
    const unique = new Set<string>();

    for (const row of observations) unique.add(row.date.slice(0, 10));
    for (const row of research) unique.add(row.date.slice(0, 10));

    return [...unique].sort();
  }, [observations, research]);

  const updatedAt = useMemo(() => {
    const timestamps = [...observations, ...research]
      .map((row) => row.created_at)
      .filter(Boolean)
      .sort();

    return formatBriefUpdatedAt(timestamps[timestamps.length - 1]);
  }, [observations, research]);

  const firstDate = formatBriefDate(dates[0]);
  const lastDate = formatBriefDate(dates[dates.length - 1]);
  const dateRangeLabel =
    dates.length === 1
      ? firstDate
      : firstDate && lastDate
        ? `${firstDate} – ${lastDate}`
        : null;

  const visibleResearch = research.slice(0, MAX_RESEARCH);
  const visibleObservations = observations.slice(0, MAX_OBSERVATIONS);

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div
            className="space-y-3"
            role="status"
            aria-label={`Loading ${label} intelligence`}
          >
            <div className="h-4 w-44 animate-pulse rounded bg-muted" />
            <div className="h-7 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-40 w-full animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm font-medium text-destructive">
            Could not load {label.toLowerCase()} intelligence
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {getApiErrorMessage(error, "Please try again in a moment.")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            {icon}
            {label}
          </Badge>

          {dateRangeLabel && (
            <Badge variant="outline" className="gap-1">
              <CalendarDays className="size-3" />
              {dateRangeLabel}
            </Badge>
          )}

          {isFallback && (
            <Badge
              variant="outline"
              className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
            >
              <AlertTriangle className="size-3" />
              Latest data
            </Badge>
          )}

          {updatedAt && (
            <span className="text-xs text-muted-foreground">
              Updated {updatedAt}
            </span>
          )}
        </div>

        <CardTitle className="mt-1 text-xl leading-snug sm:text-2xl">
          Latest developments and research
        </CardTitle>

        <CardDescription>
          Recent observations stored by Weather for this domain, the research
          generated from them, and the source evidence behind that research.
        </CardDescription>

        <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Eye className="size-3.5" />
            {observations.length} observation
            {observations.length === 1 ? "" : "s"}
          </span>

          <span className="flex items-center gap-1.5">
            <FlaskConical className="size-3.5" />
            {research.length} research item
            {research.length === 1 ? "" : "s"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {observations.length === 0 && research.length === 0 ? (
          <div className="flex items-start gap-3 rounded-lg border border-dashed p-4">
            <Eye className="mt-0.5 size-5 shrink-0 text-muted-foreground" />

            <div>
              <p className="text-sm font-medium">
                {latest || !dateLabel
                  ? `No ${label.toLowerCase()} observations stored yet`
                  : `No ${label.toLowerCase()} observations for ${dateLabel}`}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {latest || !dateLabel
                  ? "Rows will appear here after the next collection run."
                  : "Pick another date or switch to Latest to see the most recent observations."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid items-start gap-5 xl:grid-cols-2">
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    <Eye className="size-3.5" />
                    Recent observations
                  </h3>

                  <span className="text-xs text-muted-foreground">
                    {observations.length} item
                    {observations.length === 1 ? "" : "s"}
                  </span>
                </div>

                {visibleObservations.length > 0 ? (
                  <ul className="mt-3 divide-y divide-border/60 overflow-hidden rounded-lg border bg-card">
                    {visibleObservations.map((observation) => (
                      <li
                        key={observation.id}
                        className="flex flex-col gap-1 px-3 py-2.5"
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px]">
                            {formatResearchToken(observation.type)}
                          </Badge>

                          <span className="text-[10px] text-muted-foreground">
                            {formatBriefDate(observation.date)}
                          </span>
                        </div>

                        <p className="text-sm leading-relaxed text-foreground/80">
                          {observation.observation}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    No observations were stored for this domain.
                  </p>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    <FlaskConical className="size-3.5" />
                    Research highlights
                  </h3>

                  <span className="text-xs text-muted-foreground">
                    {research.length} item{research.length === 1 ? "" : "s"}
                  </span>
                </div>

                {visibleResearch.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {visibleResearch.map((entry) => (
                      <CompactResearchCard key={entry.id} entry={entry} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    No research was generated for this domain.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
              <span className="text-xs text-muted-foreground">
                {observations.length > MAX_OBSERVATIONS ||
                research.length > MAX_RESEARCH
                  ? "Showing the most recent items."
                  : "All stored items for this domain are shown."}
              </span>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onViewAll?.(domain)}
                className="h-auto max-w-full whitespace-normal"
              >
                View all {label}
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
