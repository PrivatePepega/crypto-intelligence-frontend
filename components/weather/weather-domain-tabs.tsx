"use client";

import { Button } from "@/components/ui/button";
import { WEATHER_DOMAINS, type WeatherDomain } from "@/lib/weather-domains";

interface WeatherDomainTabsProps {
  activeDomain: WeatherDomain;
  onDomainChange: (domain: WeatherDomain) => void;
}

/**
 * One button per market domain. Each weather brief is stored per domain, so
 * these read as filters for the single brief card below rather than as
 * separate sections.
 */
export function WeatherDomainTabs({
  activeDomain,
  onDomainChange,
}: WeatherDomainTabsProps) {
  return (
    <div
      className="flex flex-wrap gap-1.5"
      role="group"
      aria-label="Weather brief domains"
    >
      {WEATHER_DOMAINS.map((domain) => {
        const isActive = domain.id === activeDomain;

        return (
          <Button
            key={domain.id}
            type="button"
            size="sm"
            variant={isActive ? "default" : "outline"}
            aria-pressed={isActive}
            onClick={() => onDomainChange(domain.id)}
            className="h-auto max-w-full whitespace-normal py-1"
          >
            {domain.label}
          </Button>
        );
      })}
    </div>
  );
}
