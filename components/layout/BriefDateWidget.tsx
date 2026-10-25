"use client";

import { CalendarDays, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBriefSelection } from "@/components/providers/brief-selection-provider";
import { useTodayApiDate } from "@/hooks/use-today-api-date";
import { formatBriefDate } from "@/lib/brief-format";

/**
 * Sidebar briefing date selector. One selection drives the weather brief,
 * climate brief, and weather observations/research.
 */
export function BriefDateWidget() {
  const { date, latest, setDate, setLatest, isLoading, isFallback } =
    useBriefSelection();
  const today = useTodayApiDate();

  const dateLabel = formatBriefDate(date ?? undefined);

  const status = latest
    ? "Showing the latest available data."
    : !dateLabel
      ? "Choose a date to load its data."
      : isLoading
        ? `Checking ${dateLabel}…`
        : isFallback
          ? `No data for ${dateLabel}. Showing the latest available instead.`
          : `Weather, climate, and observations for ${dateLabel}.`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-1">
        <h2 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <CalendarDays className="size-3" />
          Snapshots
        </h2>

        {isFallback && !latest && (
          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-[9px] leading-4 text-amber-700 dark:text-amber-400"
          >
            No Data
          </Badge>
        )}
      </div>

      <Input
        type="date"
        value={date ?? ""}
        max={today ?? undefined}
        disabled={latest}
        aria-label="Briefing date"
        onChange={(event) => {
          if (event.target.value) {
            setDate(event.target.value);
          }
        }}
        className="h-8 w-full bg-background px-2 text-xs"
      />

      <Button
        type="button"
        size="sm"
        variant={latest ? "default" : "outline"}
        aria-pressed={latest}
        onClick={() => setLatest(!latest)}
        className="w-full"
        title="Ignore the selected date and use the most recent stored data"
      >
        <Zap className="size-3.5" />
        Latest
      </Button>

      <p className="text-[10px] leading-relaxed text-muted-foreground">
        {status}
      </p>
    </div>
  );
}
