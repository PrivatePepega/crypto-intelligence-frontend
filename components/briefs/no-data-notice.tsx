import { AlertTriangle } from "lucide-react";

interface NoDataNoticeProps {
  /** Formatted selected date, e.g. "October 7, 2026". */
  dateLabel?: string | null;
}

/**
 * Shown when the selected briefing date has no stored rows and the section is
 * displaying the latest available data instead.
 */
export function NoDataNotice({ dateLabel }: NoDataNoticeProps) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-300">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />

      <div>
        <p className="font-medium">
          No data for {dateLabel ?? "the selected date"}
        </p>
        <p className="mt-0.5 text-xs text-amber-700/90 dark:text-amber-300/80">
          Showing the latest available data instead.
        </p>
      </div>
    </div>
  );
}
