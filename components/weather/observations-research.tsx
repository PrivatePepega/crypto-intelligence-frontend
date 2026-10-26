"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  ChevronDown,
  Database,
  ExternalLink,
  Eye,
  FlaskConical,
  Sparkles,
} from "lucide-react";

import { NoDataNotice } from "@/components/briefs/no-data-notice";
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
import { WEATHER_DOMAINS } from "@/lib/weather-domains";
import type {
  WeatherObservationsResearchResponse,
  WeatherResearchEntry,
} from "@/types";

interface ObservationsResearchSectionProps {
  data: WeatherObservationsResearchResponse | undefined;
  isLoading: boolean;
  error: unknown;
  /** True when the selected date had no rows and the latest set is shown. */
  isFallback?: boolean;
  /** Formatted selected date, used in the empty state. */
  dateLabel?: string | null;
  /** True when the request asked for the most recent data instead of a date. */
  latest?: boolean;
  /** Render the section heading above the card. */
  showHeading?: boolean;
  sectionTitle?: string;
  sectionDescription?: string;
  cardTitle?: string;
  cardDescription?: string;
  /** Controlled domain selection; omit to let the section manage it. */
  activeDomain?: string;
  onDomainChange?: (domain: string) => void;
}

function groupByDomain<T extends { market_domain: string }>(
  rows: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const row of rows) {
    const existing = groups.get(row.market_domain);

    if (existing) {
      existing.push(row);
    } else {
      groups.set(row.market_domain, [row]);
    }
  }

  return groups;
}

function ResearchField({ label, value }: { label: string; value: string }) {
  if (!value) return null;

  return (
    <div>
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </h4>

      <p className="mt-1 text-sm leading-relaxed text-foreground/80">{value}</p>
    </div>
  );
}

function SourceList({ sources }: { sources: string[] }) {
  const uniqueSources = [...new Set(sources.map((source) => source.trim()))].filter(
    Boolean
  );

  if (uniqueSources.length === 0) return null;

  return (
    <div>
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Sources & evidence
      </h4>

      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {uniqueSources.map((source, index) =>
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
    </div>
  );
}

function ResearchCard({
  entry,
  showDate,
}: {
  entry: WeatherResearchEntry;
  showDate: boolean;
}) {
  const details = parseResearchDetails(entry.research);
  const status = details?.status ?? "";
  const date = showDate ? formatBriefDate(entry.date) : null;

  return (
    <details
      id={`research-${entry.id}`}
      className="group scroll-mt-24 rounded-lg border bg-card"
    >
      <summary className="cursor-pointer list-none p-4 [&::-webkit-details-marker]:hidden">
        <span className="flex flex-wrap items-center gap-1.5">
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

          {date && (
            <span className="text-xs text-muted-foreground">{date}</span>
          )}

          <span className="ml-auto flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <span className="group-open:hidden">Details</span>
            <span className="hidden group-open:inline">Hide</span>

            <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
          </span>
        </span>

        <span className="mt-2 block text-sm font-medium leading-relaxed text-foreground">
          {entry.observation}
        </span>

        {details?.finding && (
          <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">
            {details.finding}
          </span>
        )}
      </summary>

      <div className="space-y-4 border-t p-4">
        {details ? (
          <>
            <ResearchField label="Importance" value={details.importance} />
            <ResearchField label="Evidence" value={details.evidence} />
            <ResearchField label="Context" value={details.context} />
            <ResearchField label="Uncertainty" value={details.uncertainty} />
            <SourceList sources={details.sources} />
          </>
        ) : (
          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-muted-foreground">
            {entry.research}
          </pre>
        )}
      </div>
    </details>
  );
}

function BriefStateCard({ children }: { children: ReactNode }) {
  return <Card className="p-6">{children}</Card>;
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-1 text-muted-foreground">{description}</p>
    </div>
  );
}

export function ObservationsResearchSection({
  data,
  isLoading,
  error,
  isFallback,
  dateLabel,
  latest,
  showHeading = true,
  sectionTitle = "Observations & Research",
  sectionDescription = "Stored market observations and the research generated for them, grouped by domain.",
  cardTitle = "Daily Observations",
  cardDescription = "Stored observations and the research generated for them. Select a domain to explore its data.",
  activeDomain: controlledDomain,
  onDomainChange,
}: ObservationsResearchSectionProps) {
  const [internalDomain, setInternalDomain] = useState<string>(
    WEATHER_DOMAINS[0].id
  );

  const activeDomain = controlledDomain ?? internalDomain;
  const setActiveDomain = onDomainChange ?? setInternalDomain;

  const heading = showHeading ? (
    <SectionHeading
      title={sectionTitle}
      description={sectionDescription}
    />
  ) : null;

  const observationsByDomain = useMemo(
    () => groupByDomain(data?.observations ?? []),
    [data?.observations]
  );

  const researchByDomain = useMemo(
    () => groupByDomain(data?.research ?? []),
    [data?.research]
  );

  const dates = useMemo(() => {
    const unique = new Set<string>();

    for (const row of data?.observations ?? []) {
      unique.add(row.date.slice(0, 10));
    }

    for (const row of data?.research ?? []) {
      unique.add(row.date.slice(0, 10));
    }

    return [...unique].sort();
  }, [data]);

  const updatedAt = useMemo(() => {
    const timestamps = [
      ...(data?.observations ?? []),
      ...(data?.research ?? []),
    ]
      .map((row) => row.created_at)
      .filter(Boolean)
      .sort();

    return formatBriefUpdatedAt(timestamps[timestamps.length - 1]);
  }, [data]);

  if (isLoading) {
    return (
      <section>
        {heading}

        <BriefStateCard>
          <div
            className="space-y-3"
            role="status"
            aria-label="Loading observations and research"
          >
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
            <div className="h-7 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-48 w-full animate-pulse rounded bg-muted" />
          </div>
        </BriefStateCard>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        {heading}

        <BriefStateCard>
          <p className="text-sm font-medium text-destructive">
            Could not load observations and research
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {getApiErrorMessage(error, "Please try again in a moment.")}
          </p>
        </BriefStateCard>
      </section>
    );
  }

  if (!data || (data.observations.length === 0 && data.research.length === 0)) {
    return (
      <section>
        {heading}

        <BriefStateCard>
          <div className="flex items-start gap-3">
            <Database className="mt-0.5 size-5 shrink-0 text-muted-foreground" />

            <div>
              <p className="text-sm font-medium">
                {latest || !dateLabel
                  ? "No observations stored yet"
                  : `No observations for ${dateLabel}`}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {latest || !dateLabel
                  ? "Observation and research rows will appear here after the next collection run."
                  : "Pick another date or switch to Latest to see the most recent observations."}
              </p>
            </div>
          </div>
        </BriefStateCard>
      </section>
    );
  }

  const observations = sortByMostRecent(
    observationsByDomain.get(activeDomain) ?? []
  );
  const research = sortByMostRecent(
    researchByDomain.get(activeDomain) ?? []
  );

  // Research rows carry their own id and point back to the observation they
  // explain. The anchor on each research card uses the research id, so this map
  // resolves an observation to the card that should open for it.
  const researchIdByObservation = new Map(
    research.map((entry) => [entry.observation_id, entry.id])
  );

  const firstDate = formatBriefDate(dates[0]);
  const lastDate = formatBriefDate(dates[dates.length - 1]);
  const dateRangeLabel =
    dates.length === 1
      ? firstDate
      : firstDate && lastDate
        ? `${firstDate} – ${lastDate}`
        : null;

  const showDates = dates.length > 1;

  return (
    <section>
      {heading}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="size-3" />
              Observation set
            </Badge>

            {dateRangeLabel && (
              <Badge variant="outline" className="gap-1">
                <CalendarDays className="size-3" />
                {dateRangeLabel}
              </Badge>
            )}

            {updatedAt && (
              <span className="text-xs text-muted-foreground">
                Updated {updatedAt}
              </span>
            )}
          </div>

          <CardTitle className="mt-1 text-xl leading-snug sm:text-2xl">
            {cardTitle}
          </CardTitle>

          <CardDescription>
            {cardDescription}
          </CardDescription>

          <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Database className="size-3.5" />
              {data.observations.length} observations
            </span>

            <span className="flex items-center gap-1.5">
              <FlaskConical className="size-3.5" />
              {data.research.length} research items
            </span>

            <span className="flex items-center gap-1.5">
              <Eye className="size-3.5" />
              {WEATHER_DOMAINS.length} domains
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {isFallback && <NoDataNotice dateLabel={dateLabel} />}
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label="Market domains"
          >
            {WEATHER_DOMAINS.map((domain) => {
              const count = observationsByDomain.get(domain.id)?.length ?? 0;
              const isActive = domain.id === activeDomain;

              return (
                <Button
                  key={domain.id}
                  type="button"
                  size="sm"
                  variant={isActive ? "default" : "outline"}
                  aria-pressed={isActive}
                  onClick={() => setActiveDomain(domain.id)}
                  className="h-auto max-w-full whitespace-normal py-1"
                >
                  {domain.label}

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

          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <Eye className="size-3.5" />
                Recent observations
              </h3>

              <span className="text-xs text-muted-foreground">
                {observations.length} item
                {observations.length === 1 ? "" : "s"} · collected by Weather
              </span>
            </div>

            {observations.length > 0 ? (
              <div
                key={activeDomain}
                className="mt-3 max-h-[32rem] overflow-y-auto rounded-lg border bg-card"
              >
                <ul className="divide-y divide-border/60">
                  {observations.map((observation) => (
                    <li
                      key={observation.id}
                      className="flex flex-col gap-1.5 px-3 py-2.5 sm:flex-row sm:items-start sm:gap-3"
                    >
                      <div className="flex flex-wrap items-center gap-1.5 sm:w-44 sm:shrink-0">
                        <Badge variant="outline" className="text-[10px]">
                          {formatResearchToken(observation.type)}
                        </Badge>

                        {showDates && (
                          <span className="text-[10px] text-muted-foreground">
                            {formatBriefDate(observation.date)}
                          </span>
                        )}

                        {researchIdByObservation.has(observation.id) && (
                          <a
                            href={`#research-${researchIdByObservation.get(
                              observation.id
                            )}`}
                            onClick={() => {
                              const researchId = researchIdByObservation.get(
                                observation.id
                              );

                              if (!researchId) return;

                              const target = document.getElementById(
                                `research-${researchId}`
                              );

                              if (target instanceof HTMLDetailsElement) {
                                target.open = true;
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                          >
                            <FlaskConical className="size-3" />
                            Researched
                          </a>
                        )}
                      </div>

                      <p className="min-w-0 flex-1 text-sm leading-relaxed text-foreground/80">
                        {observation.observation}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
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
                Research generated from observations
              </h3>

              <span className="text-xs text-muted-foreground">
                {research.length} item{research.length === 1 ? "" : "s"}
              </span>
            </div>

            {research.length > 0 ? (
              <div className="mt-3 grid items-start gap-3 xl:grid-cols-2">
                {research.map((entry) => (
                  <ResearchCard
                    key={entry.id}
                    entry={entry}
                    showDate={showDates}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No research was generated for this domain.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
