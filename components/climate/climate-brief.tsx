"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
} from "lucide-react";

import { NoDataNotice } from "@/components/briefs/no-data-notice";
import { BriefMarkdown } from "@/components/climate/brief-markdown";
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
import {
  cleanBriefText,
  formatBriefDate,
  formatBriefUpdatedAt,
} from "@/lib/brief-format";
import type { ClimateBrief } from "@/types";

interface ClimateBriefSectionProps {
  brief: ClimateBrief | null | undefined;
  isLoading: boolean;
  error: unknown;
  /** True when the selected date had no brief and the latest is shown. */
  isFallback?: boolean;
  /** Formatted selected date, used in the empty state. */
  dateLabel?: string | null;
  /** True when the request asked for the most recent brief instead of a date. */
  latest?: boolean;
}

type ClimateSectionField =
  | "human_brief_global_overview"
  | "human_brief_macro_market_regime"
  | "human_brief_sector_conditions"
  | "human_brief_important_stories_narratives"
  | "human_brief_trends_capital_direction"
  | "human_brief_outlook_risks_uncertainties";

interface ClimateChapter {
  key: string;
  title: string;
  content: string;
}

const CHAPTER_DEFINITIONS: ReadonlyArray<{
  key: string;
  title: string;
  field: ClimateSectionField;
}> = [
  {
    key: "overview",
    title: "Global Overview",
    field: "human_brief_global_overview",
  },
  {
    key: "macro",
    title: "Macro & Market Regime",
    field: "human_brief_macro_market_regime",
  },
  {
    key: "sectors",
    title: "Sector Conditions",
    field: "human_brief_sector_conditions",
  },
  {
    key: "stories",
    title: "Important Stories & Narratives",
    field: "human_brief_important_stories_narratives",
  },
  {
    key: "capital",
    title: "Trends & Capital Direction",
    field: "human_brief_trends_capital_direction",
  },
  {
    key: "outlook",
    title: "Outlook, Risks & Uncertainties",
    field: "human_brief_outlook_risks_uncertainties",
  },
];

function getChapters(brief: ClimateBrief): ClimateChapter[] {
  return CHAPTER_DEFINITIONS.map((definition) => ({
    key: definition.key,
    title: definition.title,
    content: brief[definition.field] ?? "",
  })).filter((chapter) => chapter.content.trim().length > 0);
}

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function getReadingMinutes(text: string): number {
  return Math.max(1, Math.round(countWords(text) / 220));
}

function BriefStateCard({ children }: { children: ReactNode }) {
  return <Card className="p-6">{children}</Card>;
}

function SectionHeading() {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold">Climate Brief</h2>
      <p className="mt-1 text-muted-foreground">
        Long-form climate intelligence across the macro regime, sectors, capital
        flows, and risks.
      </p>
    </div>
  );
}

export function ClimateBriefSection({
  brief,
  isLoading,
  error,
  isFallback,
  dateLabel,
  latest,
}: ClimateBriefSectionProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const chapters = useMemo(() => (brief ? getChapters(brief) : []), [brief]);

  const activeChapter =
    chapters.find((chapter) => chapter.key === selectedKey) ?? chapters[0];

  const activeIndex = activeChapter
    ? chapters.findIndex((chapter) => chapter.key === activeChapter.key)
    : -1;

  const totalReadingMinutes = Math.max(
    1,
    Math.round(
      chapters.reduce(
        (total, chapter) => total + countWords(chapter.content),
        0
      ) / 220
    )
  );

  if (isLoading) {
    return (
      <section>
        <SectionHeading />

        <BriefStateCard>
          <div
            className="space-y-3"
            role="status"
            aria-label="Loading climate brief"
          >
            <div className="h-4 w-44 animate-pulse rounded bg-muted" />
            <div className="h-7 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-60 w-full animate-pulse rounded bg-muted" />
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
            Could not load the climate brief
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
                  ? "No climate brief yet"
                  : `No climate brief for ${dateLabel}`}
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

  if (!activeChapter) {
    return (
      <section>
        <SectionHeading />

        <BriefStateCard>
          <p className="text-sm font-medium">This brief has no content yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Its sections are still empty. Check back after the next generation
            run.
          </p>
        </BriefStateCard>
      </section>
    );
  }

  const displayDate = formatBriefDate(brief.date);
  const updatedAt = formatBriefUpdatedAt(brief.created_at);
  const previousChapter = activeIndex > 0 ? chapters[activeIndex - 1] : null;
  const nextChapter =
    activeIndex >= 0 && activeIndex < chapters.length - 1
      ? chapters[activeIndex + 1]
      : null;

  return (
    <section>
      <SectionHeading />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="size-3" />
              Climate brief
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
            Climate Intelligence Brief
          </CardTitle>

          <CardDescription>
            AI-generated synthesis of the latest climate intelligence set. Treat
            it as interpretation, not live market data.
          </CardDescription>

          <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <BookOpen className="size-3.5" />
              {chapters.length} chapter{chapters.length === 1 ? "" : "s"}
            </span>

            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" />~{totalReadingMinutes} min read
            </span>
          </div>
        </CardHeader>

        <CardContent>
          {isFallback && (
            <div className="mb-4">
              <NoDataNotice dateLabel={dateLabel} />
            </div>
          )}

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] lg:gap-6">
            <div>
              <p className="mb-2 hidden text-[10px] font-medium uppercase tracking-wider text-muted-foreground lg:block">
                Chapters
              </p>

              <div
                className="flex flex-wrap gap-1.5 lg:flex-col"
                role="group"
                aria-label="Brief chapters"
              >
                {chapters.map((chapter, index) => {
                  const isActive = chapter.key === activeChapter.key;

                  return (
                    <Button
                      key={chapter.key}
                      type="button"
                      size="sm"
                      variant={isActive ? "default" : "outline"}
                      aria-pressed={isActive}
                      onClick={() => setSelectedKey(chapter.key)}
                      className="h-auto max-w-full whitespace-normal py-1 text-left lg:w-full lg:justify-start"
                    >
                      <span
                        className={
                          isActive
                            ? "font-mono text-[10px] text-primary-foreground/70"
                            : "font-mono text-[10px] text-muted-foreground"
                        }
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      {chapter.title}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="min-w-0 rounded-lg border bg-muted/20 p-4 sm:p-6">
              <div className="mx-auto max-w-3xl">
                <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2 border-b pb-3">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Chapter {activeIndex + 1}
                    </p>

                    <h3 className="mt-1 text-xl font-bold leading-snug">
                      {activeChapter.title}
                    </h3>
                  </div>

                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />~
                    {getReadingMinutes(activeChapter.content)} min read
                  </span>
                </div>

                <BriefMarkdown content={cleanBriefText(activeChapter.content)} />

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!previousChapter}
                    onClick={() =>
                      previousChapter && setSelectedKey(previousChapter.key)
                    }
                  >
                    <ChevronLeft className="size-3.5" />
                    Previous
                  </Button>

                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {activeIndex + 1} / {chapters.length}
                  </span>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!nextChapter}
                    onClick={() =>
                      nextChapter && setSelectedKey(nextChapter.key)
                    }
                  >
                    Next
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
