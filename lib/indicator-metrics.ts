import type { IndicatorDataItem } from "@/types";

/**
 * Some sources store many unrelated measurements in a single series: the CFTC
 * report holds five participant groups, Binance positioning carries account,
 * open-interest, funding, and taker buckets, and CoinMarketCap aggregates the
 * whole crypto market. The default card only reads the first numeric column,
 * so these definitions expose each meaningful column as its own reading.
 *
 * Everything here is derived on the client from the existing `/fetchData`
 * response. No extra requests or backend changes are required.
 */

export type MetricFormat =
  /** Whole contracts or other discrete counts. */
  | "contracts"
  /** Compact USD, e.g. $2.93T. */
  | "currency"
  /** Compact plain number, e.g. 34.6K. */
  | "compact-number"
  /** Value already expressed in percent units, e.g. 59.02 -> 59.02%. */
  | "percent"
  /** Fraction that must be multiplied by 100, e.g. 0.5038 -> 50.38%. */
  | "fraction-percent"
  /** Small decimal rate that must be multiplied by 100, e.g. 0.00001541. */
  | "rate-percent"
  /** Ratio with up to four decimals. */
  | "ratio"
  /** Integer with thousands separators. */
  | "integer"
  /** Percentage-point difference, e.g. +0.43 pp. */
  | "percent-points"
  /** USD price with cent precision. */
  | "price";

export interface MetricComponentDefinition {
  label: string;
  /** Column in the current row. Falls back to the latest historical row. */
  currentKey: string;
  /** Historical column when the current row does not carry it. */
  historyKey?: string;
  format: MetricFormat;
  /** Day-over-day percent change column in the current row. */
  deltaPercentKey?: string;
  /** Compare the latest two historical rows when no delta column exists. */
  weekChange?: boolean;
}

export interface MetricDefinition {
  /** Stable suffix used for React keys. */
  key: string;
  label: string;
  subtitle: string;
  currentKey: string;
  historyKey: string;
  unitLabel: string;
  format: MetricFormat;
  components?: readonly MetricComponentDefinition[];
}

export interface IndicatorCardComponent {
  label: string;
  value: number | null;
  deltaPercent: number | null;
  formatValue: (value: number | null) => string;
}

export interface IndicatorCardMetric {
  label: string;
  subtitle: string;
  unitLabel: string;
  formatValue: (value: number | null) => string;
  components: IndicatorCardComponent[];
}

export interface IndicatorMetricCard {
  key: string;
  /** Single-series view used for the chart, moving averages, and net change. */
  item: IndicatorDataItem;
  metric: IndicatorCardMetric;
}

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const ratioFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 4,
});

/** Formats a raw metric value for both the card and its chart axis. */
export function formatMetricValue(
  value: number | null,
  format: MetricFormat
): string {
  if (value === null || !Number.isFinite(value)) return "—";

  switch (format) {
    case "contracts":
    case "integer":
      return integerFormatter.format(value);
    case "compact-number":
      return compactNumberFormatter.format(value);
    case "currency":
      return compactCurrencyFormatter.format(value);
    case "percent":
      return `${value.toFixed(2)}%`;
    case "fraction-percent":
      return `${(value * 100).toFixed(2)}%`;
    case "rate-percent":
      return `${(value * 100).toFixed(4)}%`;
    case "ratio":
      return ratioFormatter.format(value);
    case "percent-points":
      return `${value > 0 ? "+" : ""}${value.toFixed(2)} pp`;
    case "price":
      return priceFormatter.format(value);
  }
}

function createFormatter(format: MetricFormat) {
  return (value: number | null) => formatMetricValue(value, format);
}

function readNumber(
  row: Record<string, unknown> | null | undefined,
  key: string | null | undefined
): number | null {
  if (!row || !key) return null;

  const value = row[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getLatestRows(item: IndicatorDataItem): {
  latest: Record<string, unknown> | null;
  previous: Record<string, unknown> | null;
} {
  if (item.historical.length === 0) {
    return { latest: null, previous: null };
  }

  // The API returns history ascending, but sort defensively so the comparison
  // rows stay correct if that ever changes.
  const rows = [...item.historical].sort((a, b) =>
    String(a.date ?? "").localeCompare(String(b.date ?? ""))
  );

  return {
    latest: rows[rows.length - 1] ?? null,
    previous: rows[rows.length - 2] ?? null,
  };
}

function resolveComponentValue(
  item: IndicatorDataItem,
  definition: MetricComponentDefinition,
  latest: Record<string, unknown> | null
): number | null {
  const currentValue = readNumber(item.current, definition.currentKey);
  if (currentValue !== null) return currentValue;

  return readNumber(latest, definition.historyKey ?? definition.currentKey);
}

function resolveComponentDelta(
  item: IndicatorDataItem,
  definition: MetricComponentDefinition,
  latest: Record<string, unknown> | null,
  previous: Record<string, unknown> | null
): number | null {
  const currentDelta = readNumber(item.current, definition.deltaPercentKey);
  if (currentDelta !== null) return currentDelta;

  if (!definition.weekChange || !latest || !previous) return null;

  const key = definition.historyKey ?? definition.currentKey;
  const latestValue = readNumber(latest, key);
  const previousValue = readNumber(previous, key);

  if (latestValue === null || previousValue === null || previousValue === 0) {
    return null;
  }

  return ((latestValue - previousValue) / Math.abs(previousValue)) * 100;
}

function participantMetric(
  netKey: string,
  label: string,
  subtitle: string
): MetricDefinition {
  const participant = netKey.replace(/_net$/, "");
  const components: MetricComponentDefinition[] = [
    {
      label: "Long",
      currentKey: `${participant}_long`,
      format: "contracts",
      weekChange: true,
    },
    {
      label: "Short",
      currentKey: `${participant}_short`,
      format: "contracts",
      weekChange: true,
    },
  ];

  // Non-reportables are not split into spreading positions by the CFTC.
  if (participant !== "non_reportables") {
    components.push({
      label: "Spread",
      currentKey: `${participant}_spread`,
      format: "contracts",
      weekChange: true,
    });
  }

  components.push({
    label: "30-day MA",
    currentKey: `moving_average_30d_${netKey}`,
    historyKey: netKey,
    format: "contracts",
  });

  return {
    key: participant,
    label,
    subtitle,
    currentKey: `current_${netKey}`,
    historyKey: netKey,
    unitLabel: "Contracts",
    format: "contracts",
    components,
  };
}

const CFTC_METRICS: readonly MetricDefinition[] = [
  {
    key: "open_interest",
    label: "Open interest",
    subtitle:
      "Total futures contracts outstanding across every participant category. Rising open interest means new money is entering the market.",
    currentKey: "current_open_interest",
    historyKey: "open_interest",
    unitLabel: "Contracts",
    format: "contracts",
    components: [
      {
        label: "Previous week",
        currentKey: "previous_week_open_interest",
        format: "contracts",
      },
      {
        label: "Weekly change",
        currentKey: "open_interest_net_change",
        format: "contracts",
      },
      {
        label: "30-day MA",
        currentKey: "moving_average_30d_open_interest",
        historyKey: "open_interest",
        format: "contracts",
      },
    ],
  },
  participantMetric(
    "dealer_net",
    "Dealer / intermediary net",
    "Net dealer exposure after hedging client flow. A negative value means dealers are net short; dealers usually mirror the other side of client demand."
  ),
  participantMetric(
    "asset_manager_net",
    "Asset manager net",
    "Net long-minus-short exposure of asset managers and institutional accounts, typically reflecting slower, longer-horizon allocation."
  ),
  participantMetric(
    "leveraged_money_net",
    "Leveraged money net",
    "Net exposure of leveraged funds. This group is the most momentum-sensitive and often flips direction around short-term price moves."
  ),
  participantMetric(
    "other_reportables_net",
    "Other reportables net",
    "Net exposure of reportable traders that do not fit the dealer, asset-manager, or leveraged-money categories."
  ),
  participantMetric(
    "non_reportables_net",
    "Non-reportables net",
    "Net exposure of small traders below the CFTC reporting thresholds, a rough proxy for retail participation."
  ),
];

const BINANCE_METRICS: readonly MetricDefinition[] = [
  {
    key: "positioning",
    label: "Global account positioning",
    subtitle:
      "Long/short ratio across global Binance accounts in this market. Values above 1 mean more accounts are long than short; this is exchange-specific, not market-wide.",
    currentKey: "current_global_long_short_ratio",
    historyKey: "global_long_short_ratio",
    unitLabel: "Ratio",
    format: "ratio",
    components: [
      {
        label: "Global long accounts",
        currentKey: "current_global_long_account",
        historyKey: "global_long_account",
        format: "fraction-percent",
        deltaPercentKey: "global_long_account_percent_change",
      },
      {
        label: "Global short accounts",
        currentKey: "current_global_short_account",
        historyKey: "global_short_account",
        format: "fraction-percent",
        deltaPercentKey: "global_short_account_percent_change",
      },
      {
        label: "Top account long",
        currentKey: "current_top_account_long_account",
        historyKey: "top_account_long_account",
        format: "fraction-percent",
        deltaPercentKey: "top_account_long_account_percent_change",
      },
      {
        label: "Top account short",
        currentKey: "current_top_account_short_account",
        historyKey: "top_account_short_account",
        format: "fraction-percent",
        deltaPercentKey: "top_account_short_account_percent_change",
      },
      {
        label: "Top account ratio",
        currentKey: "current_top_account_long_short_ratio",
        historyKey: "top_account_long_short_ratio",
        format: "ratio",
        deltaPercentKey: "top_account_long_short_ratio_percent_change",
      },
      {
        label: "Top position long",
        currentKey: "current_top_position_long_account",
        historyKey: "top_position_long_account",
        format: "fraction-percent",
        deltaPercentKey: "top_position_long_account_percent_change",
      },
      {
        label: "Top position short",
        currentKey: "current_top_position_short_account",
        historyKey: "top_position_short_account",
        format: "fraction-percent",
        deltaPercentKey: "top_position_short_account_percent_change",
      },
      {
        label: "Top position ratio",
        currentKey: "current_top_position_long_short_ratio",
        historyKey: "top_position_long_short_ratio",
        format: "ratio",
        deltaPercentKey: "top_position_long_short_ratio_percent_change",
      },
      {
        label: "Open interest",
        currentKey: "current_sum_open_interest",
        historyKey: "sum_open_interest",
        format: "contracts",
        deltaPercentKey: "sum_open_interest_percent_change",
      },
      {
        label: "Open interest value",
        currentKey: "current_sum_open_interest_value",
        historyKey: "sum_open_interest_value",
        format: "currency",
        deltaPercentKey: "sum_open_interest_value_percent_change",
      },
      {
        label: "Funding rate",
        currentKey: "current_funding_rate",
        historyKey: "funding_rate",
        format: "rate-percent",
        deltaPercentKey: "funding_rate_percent_change",
      },
      {
        label: "Mark price",
        currentKey: "current_mark_price",
        historyKey: "mark_price",
        format: "price",
        deltaPercentKey: "mark_price_percent_change",
      },
      {
        label: "Taker buy/sell ratio",
        currentKey: "current_taker_buy_sell_ratio",
        historyKey: "taker_buy_sell_ratio",
        format: "ratio",
        deltaPercentKey: "taker_buy_sell_ratio_percent_change",
      },
      {
        label: "Taker buy volume",
        currentKey: "current_taker_buy_volume",
        historyKey: "taker_buy_volume",
        format: "compact-number",
        deltaPercentKey: "taker_buy_volume_percent_change",
      },
      {
        label: "Taker sell volume",
        currentKey: "current_taker_sell_volume",
        historyKey: "taker_sell_volume",
        format: "compact-number",
        deltaPercentKey: "taker_sell_volume_percent_change",
      },
      {
        label: "Circulating supply",
        currentKey: "current_cmc_circulating_supply",
        historyKey: "cmc_circulating_supply",
        format: "integer",
        deltaPercentKey: "cmc_circulating_supply_percent_change",
      },
    ],
  },
];

const CMC_METRICS: readonly MetricDefinition[] = [
  {
    key: "market_cap",
    label: "Total market capitalization",
    subtitle:
      "Aggregate value of all tracked cryptocurrencies, with the 24-hour volume and the altcoin-only share of the market.",
    currentKey: "current_total_market_cap",
    historyKey: "total_market_cap",
    unitLabel: "USD",
    format: "currency",
    components: [
      {
        label: "24h volume",
        currentKey: "current_total_volume_24h",
        historyKey: "total_volume_24h",
        format: "currency",
        deltaPercentKey: "total_volume_24h_percent_change",
      },
      {
        label: "24h market-cap change",
        currentKey: "total_market_cap_percent_change",
        format: "percent",
      },
      {
        label: "Previous day market cap",
        currentKey: "previous_day_total_market_cap",
        format: "currency",
      },
      {
        label: "Previous day volume",
        currentKey: "previous_day_total_volume_24h",
        format: "currency",
      },
      {
        label: "Altcoin market cap",
        currentKey: "current_altcoin_market_cap",
        historyKey: "altcoin_market_cap",
        format: "currency",
        deltaPercentKey: "altcoin_market_cap_percent_change",
      },
      {
        label: "Altcoin 24h volume",
        currentKey: "current_altcoin_volume_24h",
        historyKey: "altcoin_volume_24h",
        format: "currency",
        deltaPercentKey: "altcoin_volume_24h_percent_change",
      },
    ],
  },
  {
    key: "dominance",
    label: "BTC and ETH dominance",
    subtitle:
      "Share of total crypto market capitalization held by Bitcoin and Ethereum, a gauge of where capital is concentrated.",
    currentKey: "current_btc_dominance",
    historyKey: "btc_dominance",
    unitLabel: "",
    format: "percent",
    components: [
      {
        label: "Ethereum dominance",
        currentKey: "current_eth_dominance",
        historyKey: "eth_dominance",
        format: "percent",
        deltaPercentKey: "eth_dominance_percent_change",
      },
      {
        label: "BTC 24h change",
        currentKey: "btc_dominance_net_change",
        format: "percent-points",
      },
      {
        label: "ETH 24h change",
        currentKey: "eth_dominance_net_change",
        format: "percent-points",
      },
    ],
  },
  {
    key: "defi",
    label: "DeFi market",
    subtitle:
      "Market capitalization, 24-hour volume, and daily change across decentralized-finance assets.",
    currentKey: "current_defi_market_cap",
    historyKey: "defi_market_cap",
    unitLabel: "USD",
    format: "currency",
    components: [
      {
        label: "DeFi 24h volume",
        currentKey: "current_defi_volume_24h",
        historyKey: "defi_volume_24h",
        format: "currency",
        deltaPercentKey: "defi_volume_24h_percent_change",
      },
      {
        label: "DeFi 24h change",
        currentKey: "current_defi_24h_percentage_change",
        historyKey: "defi_24h_percentage_change",
        format: "percent",
      },
      {
        label: "DeFi cap 24h change",
        currentKey: "defi_market_cap_percent_change",
        format: "percent",
      },
    ],
  },
  {
    key: "stablecoins",
    label: "Stablecoin liquidity",
    subtitle:
      "Market capitalization and 24-hour activity of stablecoin assets, a proxy for crypto-native buying power.",
    currentKey: "current_stablecoin_market_cap",
    historyKey: "stablecoin_market_cap",
    unitLabel: "USD",
    format: "currency",
    components: [
      {
        label: "Stablecoin 24h volume",
        currentKey: "current_stablecoin_volume_24h",
        historyKey: "stablecoin_volume_24h",
        format: "currency",
        deltaPercentKey: "stablecoin_volume_24h_percent_change",
      },
      {
        label: "Stablecoin 24h change",
        currentKey: "current_stablecoin_24h_percentage_change",
        historyKey: "stablecoin_24h_percentage_change",
        format: "percent",
      },
      {
        label: "Stablecoin cap 24h change",
        currentKey: "stablecoin_market_cap_percent_change",
        format: "percent",
      },
    ],
  },
  {
    key: "derivatives",
    label: "Derivatives activity",
    subtitle:
      "24-hour trading volume and daily change in crypto derivatives markets.",
    currentKey: "current_derivatives_volume_24h",
    historyKey: "derivatives_volume_24h",
    unitLabel: "USD",
    format: "currency",
    components: [
      {
        label: "Derivatives 24h change",
        currentKey: "current_derivatives_24h_percentage_change",
        historyKey: "derivatives_24h_percentage_change",
        format: "percent",
      },
      {
        label: "Derivatives volume change",
        currentKey: "derivatives_volume_24h_percent_change",
        format: "percent",
      },
    ],
  },
  {
    key: "breadth",
    label: "Market breadth",
    subtitle:
      "Number of active cryptocurrencies, trading pairs, and exchanges tracked by CoinMarketCap.",
    currentKey: "current_active_cryptocurrencies",
    historyKey: "active_cryptocurrencies",
    unitLabel: "Assets",
    format: "integer",
    components: [
      {
        label: "Active market pairs",
        currentKey: "current_active_market_pairs",
        historyKey: "active_market_pairs",
        format: "integer",
        deltaPercentKey: "active_market_pairs_percent_change",
      },
      {
        label: "Active exchanges",
        currentKey: "current_active_exchanges",
        historyKey: "active_exchanges",
        format: "integer",
        deltaPercentKey: "active_exchanges_percent_change",
      },
      {
        label: "Assets 24h change",
        currentKey: "active_cryptocurrencies_net_change",
        format: "integer",
      },
    ],
  },
];

function getDefinitions(indicatorId: string): readonly MetricDefinition[] | null {
  if (indicatorId.startsWith("cftc_")) return CFTC_METRICS;
  if (indicatorId.startsWith("binance_")) return BINANCE_METRICS;

  if (indicatorId === "coinmarketcap_crypto_market_metrics") {
    return CMC_METRICS;
  }

  return null;
}

/**
 * Expands a multi-column indicator into one card per meaningful reading.
 * Indicators without a definition return an empty array so callers can keep
 * the existing single-card rendering.
 */
export function buildIndicatorMetricCards(
  item: IndicatorDataItem
): IndicatorMetricCard[] {
  const definitions = getDefinitions(item.indicator.id);
  if (!definitions) return [];

  const { latest, previous } = getLatestRows(item);

  return definitions.map((definition) => {
    const primaryValue = readNumber(item.current, definition.currentKey);

    const virtualItem: IndicatorDataItem = {
      indicator: { ...item.indicator, unit: definition.unitLabel },
      current: item.current
        ? {
            date: item.current.date,
            observed_at: item.current.observed_at,
            series_id: item.current.series_id,
            value: primaryValue,
          }
        : null,
      historical: item.historical.map((row) => ({
        date: row.date,
        value: readNumber(row, definition.historyKey),
      })),
      currentTable: item.currentTable,
      historicalTable: item.historicalTable,
    };

    const components = (definition.components ?? []).map((component) => ({
      label: component.label,
      value: resolveComponentValue(item, component, latest),
      deltaPercent: resolveComponentDelta(item, component, latest, previous),
      formatValue: createFormatter(component.format),
    }));

    return {
      key: `${item.indicator.id}:${definition.key}`,
      item: virtualItem,
      metric: {
        label: definition.label,
        subtitle: definition.subtitle,
        unitLabel: definition.unitLabel,
        formatValue: createFormatter(definition.format),
        components,
      },
    };
  });
}
