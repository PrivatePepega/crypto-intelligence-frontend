/**
 * Economic conditions shown in the General window.
 *
 * The backend accepts at most 25 indicators per request, so every group is
 * fetched in one batch and the tabs only filter client-side. Keep the total
 * unique ids at or below 25 when adding indicators.
 */
export const ECONOMIC_INDICATOR_CATEGORIES = [
  {
    id: "inflation",
    label: "Inflation & consumer prices",
    description:
      "Consumer price, core price, producer price, and inflation-expectation measures.",
    indicatorIds: [
      "cpi",
      "core_cpi",
      "core_pce",
      "ppi",
      "ten_year_breakeven_inflation",
    ],
  },
  {
    id: "labor",
    label: "Labor market",
    description:
      "Unemployment, payroll growth, jobless claims, and labor demand.",
    indicatorIds: [
      "unemployment_rate",
      "nonfarm_payrolls",
      "initial_jobless_claims",
      "job_openings",
    ],
  },
  {
    id: "growth",
    label: "Economic growth",
    description: "Real output and the pace of economic growth.",
    indicatorIds: ["real_gdp_growth", "real_gdp"],
  },
  {
    id: "consumer",
    label: "Consumer spending & confidence",
    description: "Household spending, income, and consumer confidence.",
    indicatorIds: [
      "retail_sales",
      "personal_income",
      "pce",
      "consumer_sentiment",
    ],
  },
  {
    id: "housing",
    label: "Housing",
    description:
      "Mortgage costs, building permits, existing sales, and new construction.",
    indicatorIds: [
      "mortgage_rate",
      "building_permits",
      "existing_home_sales",
      "housing_starts",
    ],
  },
  {
    id: "monetary",
    label: "Monetary policy & liquidity",
    description:
      "The policy rate, the Federal Reserve balance sheet, money supply, and liquidity.",
    indicatorIds: [
      "federal_funds_rate",
      "m_two_money_supply",
      "fed_total_assets",
      "reverse_repo_usage",
    ],
  },
  {
    id: "activity",
    label: "Economic activity",
    description: "Industrial output as a gauge of real economic activity.",
    indicatorIds: ["industrial_production"],
  },
] as const;

export type EconomicIndicatorCategory =
  (typeof ECONOMIC_INDICATOR_CATEGORIES)[number];

/** Every configured indicator, de-duplicated, in tab order. */
export const ECONOMIC_INDICATOR_IDS: string[] = [
  ...new Set(
    ECONOMIC_INDICATOR_CATEGORIES.flatMap((category) => [
      ...category.indicatorIds,
    ])
  ),
];
