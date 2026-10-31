import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AssetLoadError } from "@/components/assets/asset-load-error";
import { CommodityContract } from "@/components/assets/commodity-contract";
import { CommodityFundamentals } from "@/components/assets/commodity-fundamentals";
import { CommodityHistory } from "@/components/assets/commodity-history";
import { CommodityMarketStats } from "@/components/assets/commodity-market-stats";
import { CommodityProfile } from "@/components/assets/commodity-profile";
import { Button } from "@/components/ui/button";
import {
  fetchCommodityAsset,
  isWrongTickerError,
  type CommodityAssetResponse,
} from "@/lib/asset-api";
import { findAssetByRouteId } from "@/lib/asset-search";
import { buildCommodityTradingViewLink } from "@/lib/tradingview";

type CommodityPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: CommodityPageProps): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `${id.toUpperCase()} | Crypto Intelligence Platform`,
    description: `${id.toUpperCase()} commodity intelligence workspace with market data, contract details, and fundamentals.`,
  };
}

export default async function CommodityPage({
  params,
}: CommodityPageProps) {
  const { id } = await params;
  const asset = await findAssetByRouteId("commodity", id);

  if (!asset) {
    notFound();
  }

  let data: CommodityAssetResponse;

  try {
    data = await fetchCommodityAsset(asset.symbol);
  } catch (error) {
    console.error(`[commodity] Failed to load ${asset.symbol}:`, error);

    return (
      <AssetLoadError
        title={`Could not load ${asset.symbol}`}
        message={
          isWrongTickerError(error)
            ? "The backend does not recognize this ticker."
            : "The commodity intelligence service is unavailable right now. Try again shortly."
        }
      />
    );
  }

  const tradingViewLink = buildCommodityTradingViewLink(data.symbol, data.commodity.contract.exchange ?? "COMMODITY");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <CommodityProfile data={data} />

      {/* TradingView Chart Link */}
      <a
        href={tradingViewLink.tradingViewUrl}
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
        <CommodityMarketStats market={data.market} currency={data.market.currency} />
        <CommodityContract contract={data.commodity.contract} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CommodityFundamentals fundamentals={data.fundamentals!} />
        <CommodityHistory history={data.history!} />
      </div>
    </div>
  );
}