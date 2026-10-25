import type { ReactNode } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ListChecks,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { NoDataNotice } from "@/components/briefs/no-data-notice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  cleanBriefText,
  formatBriefDate,
  formatBriefUpdatedAt,
} from "@/lib/brief-format";
import type { WeatherBrief } from "@/types";

interface WeatherBriefSectionProps {
  brief: WeatherBrief | null | undefined;
  isLoading: boolean;
  error: unknown;
  /** True when the selected date had no brief and the latest is shown. */
  isFallback?: boolean;
  /** Formatted selected date, used in the empty state. */
  dateLabel?: string | null;
  /** True when the request asked for the most recent brief instead of a date. */
  latest?: boolean;
}

function formatDomain(value: string): string {
  const trimmed = cleanBriefText(value);
  if (!trimmed) return "Daily";

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function formatFigureLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatFigureValue(value: string | number): string {
  return typeof value === "number"
    ? value.toLocaleString("en-US")
    : cleanBriefText(value);
}

function BriefList({
  title,
  items,
  icon,
  iconClassName,
}: {
  title: string;
  items: string[];
  icon: ReactNode;
  iconClassName: string;
}) {
  const visibleItems = items.map(cleanBriefText).filter((item) => item.length > 0);

  if (visibleItems.length === 0) return null;

  return (
    <div className="rounded-lg border p-4">
      <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span className={iconClassName}>{icon}</span>
        {title}
      </h3>

      <ul className="mt-2.5 space-y-2">
        {visibleItems.map((item, index) => (
          <li
            key={`${index}-${item.slice(0, 24)}`}
            className="flex gap-2 text-sm leading-relaxed text-muted-foreground"
          >
            <span className="mt-2 size-1 shrink-0 rounded-full bg-current" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BriefStateCard({ children }: { children: ReactNode }) {
  return <Card className="p-6">{children}</Card>;
}

export function WeatherBriefSection({
  brief,
  isLoading,
  error,
  isFallback,
  dateLabel,
  latest,
}: WeatherBriefSectionProps) {
  if (isLoading) {
    return (
      <section>
        <SectionHeading />

        <BriefStateCard>
          <div className="space-y-3" role="status" aria-label="Loading daily brief">
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="h-7 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-20 w-full animate-pulse rounded bg-muted" />
          </div>
        </BriefStateCard>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <SectionHeading />

        <BriefStateCard>
          <p className="text-sm font-medium text-destructive">
            Could not load the daily brief
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {getApiErrorMessage(error, "Please try again in a moment.")}
          </p>
        </BriefStateCard>
      </section>
    );
  }

  if (!brief) {
    return (
      <section>
        <SectionHeading />

        <BriefStateCard>
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-0.5 size-5 shrink-0 text-muted-foreground" />

            <div>
              <p className="text-sm font-medium">
                {latest || !dateLabel
                  ? "No daily brief yet"
                  : `No daily brief for ${dateLabel}`}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {latest || !dateLabel
                  ? "The next generated brief will appear here once it is stored."
                  : "Pick another date or switch to Latest to see the most recent brief."}
              </p>
            </div>
          </div>
        </BriefStateCard>
      </section>
    );
  }

  const { human_brief: humanBrief } = brief;
  const displayDate = formatBriefDate(humanBrief.date || brief.brief_date);
  const updatedAt = formatBriefUpdatedAt(brief.created_at);
  const title = cleanBriefText(humanBrief.title) || "Daily Market Brief";
  const executiveSummary = cleanBriefText(humanBrief.executive_summary);
  const marketOutlook = cleanBriefText(humanBrief.market_outlook);
  const sections = humanBrief.sections.filter(
    (section) => cleanBriefText(section.heading) || cleanBriefText(section.body)
  );

  return (
    <section>
      <SectionHeading />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="size-3" />
              {formatDomain(brief.domain)} brief
            </Badge>

            {displayDate && (
              <Badge variant="outline" className="gap-1">
                <CalendarDays className="size-3" />
                {displayDate}
              </Badge>
            )}

            {updatedAt && (
              <span className="text-xs text-muted-foreground">
                Updated {updatedAt}
              </span>
            )}
          </div>

          <CardTitle className="mt-1 text-xl leading-snug sm:text-2xl">
            {title}
          </CardTitle>

          <CardDescription>
            AI-generated summary of the latest intelligence set. Treat it as
            interpretation, not live market data.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {isFallback && <NoDataNotice dateLabel={dateLabel} />}
          {executiveSummary && (
            <div className="rounded-lg border bg-muted/40 p-4">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="size-3.5" />
                Executive Summary
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                {executiveSummary}
              </p>
            </div>
          )}

          {sections.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {sections.map((section, index) => {
                const heading = cleanBriefText(section.heading);
                const body = cleanBriefText(section.body);
                const figures = Object.entries(section.key_figures);

                return (
                  <article
                    key={`${index}-${heading.slice(0, 24)}`}
                    className="flex flex-col rounded-lg border p-4"
                  >
                    {heading && (
                      <h3 className="text-sm font-semibold leading-snug">
                        {heading}
                      </h3>
                    )}

                    {body && (
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                        {body}
                      </p>
                    )}

                    {figures.length > 0 && (
                      <dl className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                        {figures.map(([key, value]) => (
                          <div
                            key={key}
                            className="min-w-0 rounded-md border bg-muted/30 px-2 py-1"
                          >
                            <dt className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                              {formatFigureLabel(key)}
                            </dt>

                            <dd className="text-xs font-semibold tabular-nums">
                              {formatFigureValue(value)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {marketOutlook && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <TrendingUp className="size-3.5" />
                Market Outlook
              </h3>

              <p className="mt-2 text-sm leading-relaxed">{marketOutlook}</p>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <BriefList
              title="Key Takeaways"
              items={humanBrief.key_takeaways}
              icon={<ListChecks className="size-3.5" />}
              iconClassName="text-emerald-600 dark:text-emerald-400"
            />

            <BriefList
              title="Uncertainties"
              items={humanBrief.uncertainties}
              icon={<AlertTriangle className="size-3.5" />}
              iconClassName="text-amber-600 dark:text-amber-400"
            />

            <BriefList
              title="Upcoming Catalysts"
              items={humanBrief.upcoming_catalysts}
              icon={<CalendarDays className="size-3.5" />}
              iconClassName="text-sky-600 dark:text-sky-400"
            />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function SectionHeading() {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold">Daily Brief</h2>
      <p className="mt-1 text-muted-foreground">
        Macro intelligence summary generated from the latest stored brief.
      </p>
    </div>
  );
}
