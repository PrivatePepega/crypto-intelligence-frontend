import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AssetLoadError } from "@/components/assets/asset-load-error";
import { StockCompanyDetails } from "@/components/assets/stock-company-details";
import { StockFinancials } from "@/components/assets/stock-financials";
import { StockProfile } from "@/components/assets/stock-profile";
import { StockStatistics } from "@/components/assets/stock-statistics";
import { Button } from "@/components/ui/button";
import {
  fetchStockAsset,
  isWrongTickerError,
  type StockAssetResponse,
} from "@/lib/asset-api";
import { findAssetByRouteId } from "@/lib/asset-search";
import { buildStockTradingViewLink } from "@/lib/tradingview";

type StockPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: StockPageProps): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `${id.toUpperCase()} | Crypto Intelligence Platform`,
    description: "Stock intelligence workspace.",
  };
}

export default async function StockPage({ params }: StockPageProps) {
  const { id } = await params;
  const asset = await findAssetByRouteId("stock", id);

  if (!asset) {
    notFound();
  }

  let data: StockAssetResponse;

  try {
    data = await fetchStockAsset(asset.symbol);
  } catch (error) {
    console.error(`[stock] Failed to load ${asset.symbol}:`, error);

    return (
      <AssetLoadError
        title={`Could not load ${asset.symbol}`}
        message={
          isWrongTickerError(error)
            ? "The backend does not recognize this ticker."
            : "The stock intelligence service is unavailable right now. Try again shortly."
        }
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <StockProfile data={data} />

      {/* TradingView Chart Link */}
      <a
        href={buildStockTradingViewLink(data.ticker, data.company.exchange ?? "NASDAQ").tradingViewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full"
      >
        <Button
          variant="default"
          size="lg"
          className="w-full justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-primary/30 hover:border-primary/50 h-18 text-base"
        >
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="17 3 22 3 22 8" />
            <line x1="12" y1="9" x2="12" y2="9" />
            <path d="M16 3h5v5" />
            <line x1="21" y1="12" x2="21" y2="12" />
            <path d="M3 21h18" />
            <path d="M9 15l6-6" />
          </svg>
          <span>Open TradingView Chart</span>
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="17 3 22 3 22 8" />
            <line x1="12" y1="9" x2="12" y2="9" />
            <path d="M16 3h5v5" />
            <line x1="21" y1="12" x2="21" y2="12" />
            <path d="M3 21h18" />
            <path d="M9 15l6-6" />
          </svg>
        </Button>
      </a>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <StockStatistics
          market={data.market}
          currency={data.company.currency}
        />
        <StockCompanyDetails data={data} />
      </div>

      <StockFinancials
        reports={data.financialReports}
        currency={data.company.currency}
      />
    </div>
  );
}
