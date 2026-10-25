/**
 * Market domains supported by the weather observation/research pipeline.
 *
 * These values must match the backend `ObserverDomain` union. Requests use the
 * ids; the labels are presentation only.
 */
export const WEATHER_DOMAINS = [
  { id: "macro", label: "Macro" },
  { id: "financial_markets", label: "Financial Markets" },
  { id: "geopolitics", label: "Geopolitics" },
  {
    id: "ai_technology_industry",
    label: "AI, Technology & Industry",
  },
  { id: "commodities_energy", label: "Commodities & Energy" },
  { id: "crypto", label: "Crypto" },
] as const;

export type WeatherDomain = (typeof WEATHER_DOMAINS)[number]["id"];

/** Every domain, in the order used by the domain selector. */
export const WEATHER_DOMAIN_IDS: WeatherDomain[] = WEATHER_DOMAINS.map(
  (domain) => domain.id
);

export function getWeatherDomainLabel(domain: string): string {
  return (
    WEATHER_DOMAINS.find((entry) => entry.id === domain)?.label ?? domain
  );
}
