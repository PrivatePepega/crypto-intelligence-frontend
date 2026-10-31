import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StockAssetResponse } from "@/lib/asset-api";
import {
  formatCountry,
  formatDate,
  hasValue,
} from "@/lib/asset-format";
import { cn } from "@/lib/utils";

type StockCompanyDetailsProps = {
  data: StockAssetResponse;
  className?: string;
};

function websiteLabel(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right font-medium break-words">
        {children}
      </dd>
    </div>
  );
}

function ExternalLinkText({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1 text-primary hover:underline"
    >
      {children}
      <ExternalLink className="size-3" aria-hidden />
    </a>
  );
}

/**
 * Registry and classification facts for the company. Kept separate from the
 * quote so that identity data stays readable even when market data is missing.
 */
export function StockCompanyDetails({
  data,
  className,
}: StockCompanyDetailsProps) {
  const { company } = data;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Company details</CardTitle>
        <CardDescription>
          Registry, classification and filing identifiers.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <dl className="divide-y divide-border/60">
          <DetailRow label="Legal name">{company.name}</DetailRow>
          <DetailRow label="Ticker">{data.ticker}</DetailRow>
          <DetailRow label="Exchange">
            {hasValue(company.exchange) ? company.exchange : "—"}
          </DetailRow>
          <DetailRow label="Sector">
            {hasValue(company.sector) ? company.sector : "—"}
          </DetailRow>
          <DetailRow label="Industry">
            {hasValue(company.industry) ? company.industry : "—"}
          </DetailRow>
          <DetailRow label="Country">
            {formatCountry(company.country)}
          </DetailRow>
          <DetailRow label="Currency">{company.currency}</DetailRow>
          <DetailRow label="SEC CIK">
            {hasValue(company.cik) ? (
              <ExternalLinkText
                href={`https://www.sec.gov/edgar/browse/?CIK=${encodeURIComponent(
                  company.cik
                )}`}
              >
                {company.cik}
              </ExternalLinkText>
            ) : (
              "—"
            )}
          </DetailRow>
          <DetailRow label="Website">
            {hasValue(company.website) ? (
              <ExternalLinkText href={company.website}>
                {websiteLabel(company.website)}
              </ExternalLinkText>
            ) : (
              "—"
            )}
          </DetailRow>
          <DetailRow label="Data updated">
            <span className={cn(!data.dataUpdatedAt && "text-muted-foreground")}>
              {formatDate(data.dataUpdatedAt)}
            </span>
          </DetailRow>
        </dl>
      </CardContent>
    </Card>
  );
}
