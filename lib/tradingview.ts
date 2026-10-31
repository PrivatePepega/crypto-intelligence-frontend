/**
 * TradingView URL generation utilities.
 *
 * Provides functions to build TradingView chart URLs for stocks, crypto, and
 * commodities based on the ticker data in `data/`.
 *
 * Stocks:      https://www.tradingview.com/symbols/{EXCHANGE}-{SYMBOL}/
 * Crypto:      https://www.tradingview.com/symbols/{SYMBOL}USDT/?exchange=BINANCE
 * Commodities: https://www.tradingview.com/symbols/{TRADINGVIEW_SYMBOL}/
 *              (where TradingView symbol comes from a static mapping keyed by FMP symbol)
 */

import type { AssetType } from "@/lib/asset-types";

/**
 * Static mapping from FMP commodity symbol to TradingView futures symbol.
 *
 * Keyed by the `symbol` field in `data/commodities-tickers.json` (e.g., "GCUSD").
 * Value is the TradingView symbol format (e.g., "COMEX:GC1!").
 */
export const COMMODITY_TRADINGVIEW_SYMBOL_MAP: Record<string, string> = {
  // Precious metals
  GCUSD: "COMEX:GC1!", // Gold
  SIUSD: "COMEX:SI1!", // Silver
  PLUSD: "NYMEX:PL1!", // Platinum
  PAUSD: "NYMEX:PA1!", // Palladium

  // Energy
  CLUSD: "NYMEX:CL1!", // Crude Oil (WTI)
  BZUSD: "ICEEUR:BRN1!", // Brent Crude Oil
  NGUSD: "NYMEX:NG1!", // Natural Gas
  HOUSD: "NYMEX:HO1!", // Heating Oil
  RBUSD: "NYMEX:RB1!", // Gasoline RBOB

  // Base metals
  HGUSD: "COMEX:HG1!", // Copper

  // Add more mappings as needed. Unknown symbols fall back to the FMP symbol.
};

/**
 * Result of building a TradingView URL for an asset.
 */
export interface TradingViewLink {
  /** The generated TradingView chart URL. */
  tradingViewUrl: string;
  /** Exchange used for the URL (stocks: exchange, crypto: "BINANCE", commodities: exchange from data). */
  exchange: string;
  /** Trading pair / symbol used on TradingView. */
  pair: string;
  /** For commodities: the TradingView-specific futures symbol (e.g., "COMEX:GC1!"). */
  tradingViewSymbol?: string;
}

/**
 * Build a TradingView URL for a stock.
 *
 * @param symbol - Stock ticker (e.g., "AAPL")
 * @param exchange - TradingView exchange code (e.g., "NASDAQ", "NYSE")
 * @returns TradingViewLink with url, exchange, and pair
 */
export function buildStockTradingViewLink(
  symbol: string,
  exchange: string
): TradingViewLink {
  const upperSymbol = symbol.toUpperCase();
  const upperExchange = exchange.toUpperCase();
  const pair = `${upperExchange}:${upperSymbol}`;
  const tradingViewUrl = `https://www.tradingview.com/symbols/${upperExchange}-${upperSymbol}/`;

  return {
    tradingViewUrl,
    exchange: upperExchange,
    pair,
  };
}

/**
 * Build a TradingView URL for a cryptocurrency.
 *
 * Appends "USDT" to the symbol and uses Binance as the exchange.
 *
 * @param symbol - Crypto symbol (e.g., "BTC", "DOGE")
 * @returns TradingViewLink with url, exchange ("BINANCE"), and pair (e.g., "BTCUSDT")
 */
export function buildCryptoTradingViewLink(symbol: string): TradingViewLink {
  const upperSymbol = symbol.toUpperCase();
  const pair = `${upperSymbol}USDT`;
  const exchange = "BINANCE";
  const tradingViewUrl = `https://www.tradingview.com/symbols/${pair}/?exchange=${exchange}`;

  return {
    tradingViewUrl,
    exchange,
    pair,
  };
}

/**
 * Build a TradingView URL for a commodity.
 *
 * Uses a static mapping from FMP symbol to TradingView futures symbol.
 * Falls back to the FMP symbol if no mapping exists.
 *
 * @param fmpSymbol - FMP symbol from commodities-tickers.json (e.g., "GCUSD")
 * @param exchange - Exchange from commodities-tickers.json (e.g., "COMEX")
 * @returns TradingViewLink with url, exchange, pair, and tradingViewSymbol
 */
export function buildCommodityTradingViewLink(
  fmpSymbol: string,
  exchange: string
): TradingViewLink {
  const upperFmpSymbol = fmpSymbol.toUpperCase();
  const upperExchange = exchange.toUpperCase();

  // Look up the TradingView futures symbol from the static map
  const tradingViewSymbol = COMMODITY_TRADINGVIEW_SYMBOL_MAP[upperFmpSymbol];

  let pair: string;
  let tradingViewUrl: string;

  if (tradingViewSymbol) {
    // TradingView symbol format: "EXCHANGE:SYMBOL" (e.g., "COMEX:GC1!")
    pair = tradingViewSymbol;
    // URL uses the symbol with colon replaced by dash
    const urlSymbol = tradingViewSymbol.replace(":", "-");
    tradingViewUrl = `https://www.tradingview.com/symbols/${urlSymbol}/`;
  } else {
    // Fallback: use FMP symbol with exchange prefix
    pair = `${upperExchange}:${upperFmpSymbol}`;
    tradingViewUrl = `https://www.tradingview.com/symbols/${upperExchange}-${upperFmpSymbol}/`;
  }

  return {
    tradingViewUrl,
    exchange: upperExchange,
    pair,
    tradingViewSymbol,
  };
}

/**
 * Unified function to build a TradingView link for any asset type.
 *
 * @param type - Asset type: "stock", "crypto", or "commodity"
 * @param symbol - The asset's symbol/ticker
 * @param exchange - The asset's exchange (required for stocks and commodities)
 * @returns TradingViewLink
 */
export function buildTradingViewLink(
  type: AssetType,
  symbol: string,
  exchange?: string
): TradingViewLink {
  switch (type) {
    case "stock": {
      if (!exchange) {
        throw new Error("Stock TradingView link requires an exchange");
      }
      return buildStockTradingViewLink(symbol, exchange);
    }
    case "crypto":
      return buildCryptoTradingViewLink(symbol);
    case "commodity": {
      if (!exchange) {
        throw new Error("Commodity TradingView link requires an exchange");
      }
      return buildCommodityTradingViewLink(symbol, exchange);
    }
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unknown asset type: ${exhaustiveCheck}`);
    }
  }
}

/**
 * Check if a commodity symbol has a known TradingView mapping.
 */
export function hasCommodityTradingViewMapping(symbol: string): boolean {
  return symbol.toUpperCase() in COMMODITY_TRADINGVIEW_SYMBOL_MAP;
}

/**
 * Get the TradingView symbol for a commodity if mapped, otherwise undefined.
 */
export function getCommodityTradingViewSymbol(symbol: string): string | undefined {
  return COMMODITY_TRADINGVIEW_SYMBOL_MAP[symbol.toUpperCase()];
}