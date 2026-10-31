"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StockAssetResponse, StockFinancialReport } from "@/lib/asset-api";
import {
  formatDate,
  formatMoney,
  formatPercent,
  hasValue,
} from "@/lib/asset-format";

type ReportPeriod = "quarterly" | "annual";

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  quarterly: "Quarterly",
  annual: "Annual",
};

const PERIODS: ReportPeriod[] = ["quarterly", "annual"];

type MetricFormat = "money" | "percent";

type MetricRow = {
  label: string;
  value: (report: StockFinancialReport) => number | null;
  format: MetricFormat;
};

function ratio(
  numerator: number | null,
  denominator: number | null
): number | null {
  if (numerator === null || denominator === null || denominator <= 0) {
    return null;
  }

  return (numerator / denominator) * 100;
}

/**
 * Balance-sheet lines arrive as `0` when a filing only reported the income
 * statement, so zero is treated as "not reported" for those rows.
 */
function reported(value: number | null): number | null {
  return value === 0 ? null : value;
}

const METRIC_ROWS: MetricRow[] = [
  { label: "Revenue", value: (r) => r.revenue, format: "money" },
  { label: "Gross profit", value: (r) => r.grossProfit, format: "money" },
  {
    label: "Gross margin",
    value: (r) => ratio(r.grossProfit, r.revenue),
    format: "percent",
  },
  { label: "Operating income", value: (r) => r.operatingIncome, format: "money" },
  {
    label: "Operating margin",
    value: (r) => ratio(r.operatingIncome, r.revenue),
    format: "percent",
  },
  { label: "Net income", value: (r) => r.netIncome, format: "money" },
  {
    label: "Net margin",
    value: (r) => ratio(r.netIncome, r.revenue),
    format: "percent",
  },
  {
    label: "Operating cash flow",
    value: (r) => r.operatingCashFlow,
    format: "money",
  },
  {
    label: "Capital expenditures",
    value: (r) => r.capitalExpenditures,
    format: "money",
  },
  { label: "Free cash flow", value: (r) => r.freeCashFlow, format: "money" },
  {
    label: "Total assets",
    value: (r) => reported(r.totalAssets),
    format: "money",
  },
  {
    label: "Total liabilities",
    value: (r) => reported(r.totalLiabilities),
    format: "money",
  },
  {
    label: "Cash & equivalents",
    value: (r) => reported(r.cashAndCashEquivalents),
    format: "money",
  },
];

function periodLabel(report: StockFinancialReport): string {
  const parts = [report.fiscalPeriod, report.fiscalYear].filter(hasValue);

  return parts.length > 0 ? parts.join(" ") : report.form;
}

function reportKey(report: StockFinancialReport, index: number): string {
  return (
    report.accessionNumber ??
    `${report.form}-${report.fiscalYear ?? "?"}-${report.fiscalPeriod ?? index}`
  );
}

function reportCurrency(
  report: StockFinancialReport,
  fallback: string
): string {
  return report.currency || fallback;
}

function formatMetric(
  row: MetricRow,
  report: StockFinancialReport,
  fallbackCurrency: string
): string {
  const value = row.value(report);

  if (value === null) {
    return "—";
  }

  return row.format === "money"
    ? formatMoney(value, reportCurrency(report, fallbackCurrency), {
        compact: true,
      })
    : formatPercent(value);
}

/**
 * Revenue against net income for the selected period. CSS-only so the bars
 * stay crisp without pulling in a charting library for three data points.
 */
function RevenueBars({
  reports,
  currency,
}: {
  reports: StockFinancialReport[];
  currency: string;
}) {
  // A bar chart with a shared baseline cannot represent a loss without
  // implying a positive contribution, so the chart only appears when every
  // period is profitable. The table below still shows all reported values.
  const isComparable = reports.every(
    (report) =>
      report.revenue !== null &&
      report.revenue > 0 &&
      report.netIncome !== null &&
      report.netIncome >= 0
  );

  if (!isComparable) {
    return null;
  }

  const max = Math.max(
    0,
    ...reports.flatMap((report) => [
      report.revenue ?? 0,
      report.netIncome ?? 0,
    ])
  );

  if (max <= 0) {
    return null;
  }

  const summary = reports
    .map(
      (report) =>
        `${periodLabel(report)}: revenue ${formatMoney(
          report.revenue,
          reportCurrency(report, currency),
          { compact: true }
        )}, net income ${formatMoney(
          report.netIncome,
          reportCurrency(report, currency),
          { compact: true }
        )}`
    )
    .join("; ");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-primary/70" aria-hidden />
          Revenue
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-sm bg-emerald-500/70"
            aria-hidden
          />
          Net income
        </span>
      </div>

      <div
        className="flex items-end gap-3"
        role="img"
        aria-label={`Revenue and net income by period. ${summary}`}
      >
        {reports.map((report, index) => {
          const revenueHeight =
            ((Math.max(report.revenue ?? 0, 0) / max) * 100).toFixed(1);
          const netIncomeHeight =
            ((Math.max(report.netIncome ?? 0, 0) / max) * 100).toFixed(1);

          return (
            <div
              key={reportKey(report, index)}
              className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
            >
              <div className="flex h-28 w-full items-end justify-center gap-1">
                <div
                  className="w-1/3 rounded-t bg-primary/70"
                  style={{ height: `${revenueHeight}%` }}
                />
                <div
                  className="w-1/3 rounded-t bg-emerald-500/70"
                  style={{ height: `${netIncomeHeight}%` }}
                />
              </div>
              <span className="w-full truncate text-center text-xs text-muted-foreground">
                {periodLabel(report)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilingsList({ reports }: { reports: StockFinancialReport[] }) {
  return (
    <div className="flex flex-col gap-3 border-t border-border/60 pt-4">
      <h3 className="text-xs font-medium text-muted-foreground">Filings</h3>

      <ul className="grid gap-3 sm:grid-cols-3">
        {reports.map((report, index) => (
          <li
            key={reportKey(report, index)}
            className="flex flex-col gap-1.5 rounded-md bg-muted/40 p-3 text-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-foreground">
                {periodLabel(report)}
              </span>
              <span className="text-muted-foreground">{report.form}</span>
            </div>

            <dl className="flex flex-col gap-0.5 text-muted-foreground">
              <div className="flex justify-between gap-2">
                <dt>Period end</dt>
                <dd className="tabular-nums">{formatDate(report.periodEnd)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Filed</dt>
                <dd className="tabular-nums">{formatDate(report.filingDate)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Accession</dt>
                <dd className="font-mono text-[0.7rem] break-all text-right">
                  {report.accessionNumber ?? "—"}
                </dd>
              </div>
            </dl>

            {report.sourceUrl && (
              <a
                href={report.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                View on SEC
                <ExternalLink className="size-3" aria-hidden />
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

type StockFinancialsProps = {
  reports: StockAssetResponse["financialReports"];
  currency: string;
};

/**
 * Quarterly and annual SEC extracts. The table keeps every metric visible at
 * once so periods can be compared column by column; the filing list underneath
 * carries the provenance for each column.
 */
export function StockFinancials({ reports, currency }: StockFinancialsProps) {
  const [period, setPeriod] = useState<ReportPeriod>(() =>
    reports.quarterly.length === 0 && reports.annual.length > 0
      ? "annual"
      : "quarterly"
  );

  const visibleReports = reports[period];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle>Financial reports</CardTitle>
            <CardDescription>
              Income statement, cash flow and balance sheet extracts from SEC
              filings.
            </CardDescription>
          </div>

          <div
            className="flex shrink-0 gap-1.5"
            role="group"
            aria-label="Report period"
          >
            {PERIODS.map((option) => {
              const isActive = option === period;

              return (
                <Button
                  key={option}
                  type="button"
                  size="sm"
                  variant={isActive ? "default" : "outline"}
                  aria-pressed={isActive}
                  onClick={() => setPeriod(option)}
                >
                  {PERIOD_LABELS[option]}
                </Button>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {visibleReports.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No {period} reports are stored for this company yet.
          </p>
        ) : (
          <>
            <RevenueBars reports={visibleReports} currency={currency} />

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs sm:text-sm">
                <caption className="sr-only">
                  {PERIOD_LABELS[period]} financial metrics
                </caption>

                <thead>
                  <tr className="border-b border-border/60">
                    <th
                      scope="col"
                      className="sticky left-0 z-10 bg-card pb-2 pr-2 text-left text-xs font-medium text-muted-foreground sm:pr-4"
                    >
                      Metric
                    </th>
                    {visibleReports.map((report, index) => (
                      <th
                        key={reportKey(report, index)}
                        scope="col"
                        className="pb-2 pl-2 text-right align-bottom text-xs font-medium whitespace-nowrap text-muted-foreground sm:pl-4"
                      >
                        {periodLabel(report)}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {METRIC_ROWS.map((row) => (
                    <tr
                      key={row.label}
                      className="border-b border-border/40 last:border-0"
                    >
                      <th
                        scope="row"
                        className="sticky left-0 z-10 bg-card py-2 pr-2 text-left font-normal text-muted-foreground sm:pr-4"
                      >
                        {row.label}
                      </th>
                      {visibleReports.map((report, index) => (
                        <td
                          key={reportKey(report, index)}
                          className="py-2 pl-2 text-right font-medium whitespace-nowrap tabular-nums sm:pl-4"
                        >
                          {formatMetric(row, report, currency)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <FilingsList reports={visibleReports} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
