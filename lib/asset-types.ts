/**
 * Client-safe asset types shared by the search UI, the server-side search
 * index and the asset detail pages.
 *
 * Keep this module free of Node-only imports so client components can use it.
 */

export type AssetType = "stock" | "crypto" | "commodity";

export type AssetSearchResult = {
  /** Asset class; selects the backend endpoint and the detail route. */
  type: AssetType;
  /** Route segment used in /stock/[id], /crypto/[id] or /commodity/[id]. */
  id: string;
  /** Ticker or symbol the backend endpoints expect. */
  symbol: string;
  /** Human-readable asset name. */
  name: string;
};

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  stock: "Stocks",
  crypto: "Crypto",
  commodity: "Commodities",
};

/** Display order used by the search panel and the search index. */
export const ASSET_TYPE_ORDER: AssetType[] = ["stock", "crypto", "commodity"];

const ASSET_ROUTE_SEGMENTS: Record<AssetType, string> = {
  stock: "stock",
  crypto: "crypto",
  commodity: "commodity",
};

/** Builds the detail-page URL for a search result. */
export function assetHref(
  asset: Pick<AssetSearchResult, "type" | "id">
): string {
  return `/${ASSET_ROUTE_SEGMENTS[asset.type]}/${encodeURIComponent(asset.id)}`;
}
