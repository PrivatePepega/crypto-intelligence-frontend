import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AssetLoadError } from "@/components/assets/asset-load-error";
import { CryptoExchanges } from "@/components/assets/crypto-exchanges";
import { CryptoMarketStats } from "@/components/assets/crypto-market-stats";
import { CryptoNetwork } from "@/components/assets/crypto-network";
import { CryptoProfile } from "@/components/assets/crypto-profile";
import { CryptoSecurity } from "@/components/assets/crypto-security";
import { CryptoSocials } from "@/components/assets/crypto-socials";
import { CryptoSupply } from "@/components/assets/crypto-supply";
import { CryptoTokenomics } from "@/components/assets/crypto-tokenomics";
import { Button } from "@/components/ui/button";
import {
  fetchCryptoAsset,
  isWrongTickerError,
  type CryptoAssetResponse,
} from "@/lib/asset-api";
import { findAssetByRouteId } from "@/lib/asset-search";
import { buildCryptoTradingViewLink } from "@/lib/tradingview";

type CryptoProjectPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: CryptoProjectPageProps): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `${id.toUpperCase()} | Crypto Intelligence Platform`,
    description: `${id.toUpperCase()} crypto intelligence workspace with market data, tokenomics, network info, and social links.`,
  };
}

export default async function CryptoProjectPage({
  params,
}: CryptoProjectPageProps) {
  const { id } = await params;
  const asset = await findAssetByRouteId("crypto", id);

  if (!asset) {
    notFound();
  }

  let data: CryptoAssetResponse;

  try {
    data = await fetchCryptoAsset(asset.symbol);
  } catch (error) {
    console.error(`[crypto] Failed to load ${asset.symbol}:`, error);

    return (
      <AssetLoadError
        title={`Could not load ${asset.name}`}
        message={
          isWrongTickerError(error)
            ? "The backend does not recognize this ticker."
            : "The crypto intelligence service is unavailable right now. Try again shortly."
        }
      />
    );
  }

  const tradingViewLink = buildCryptoTradingViewLink(data.symbol);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <CryptoProfile data={data} />

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
        <CryptoMarketStats market={data.market} currency={data.market.currency} />
        <CryptoSupply supply={data.supply} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CryptoNetwork network={data.network!} />
        <CryptoTokenomics tokenomics={data.tokenomics!} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CryptoSecurity security={data.security!} />
        <CryptoSocials socials={data.socials!} />
      </div>

      {(data.exchanges?.length ?? 0) > 0 && (
        <CryptoExchanges exchanges={data.exchanges} />
      )}
    </div>
  );
}