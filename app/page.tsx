"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

import { ClimateBriefSection } from "@/components/climate/climate-brief";
import { GeneralSection } from "@/components/general/general-section";
import { IndicatorExplorer } from "@/components/general/indicator-explorer";
import { useBriefSelection } from "@/components/providers/brief-selection-provider";
import { Badge } from "@/components/ui/badge";
import { ObservationsResearchSection } from "@/components/weather/observations-research";
import { WeatherDomainTabs } from "@/components/weather/weather-domain-tabs";
import { WeatherBriefSection } from "@/components/weather/weather-brief";
import { cleanBriefText, formatBriefDate } from "@/lib/brief-format";
import { WEATHER_DOMAINS } from "@/lib/weather-domains";

export default function Home() {
  const {
    weatherBriefs,
    weatherDomain,
    setWeatherDomain,
    climate,
    observations,
    date,
    latest,
  } = useBriefSelection();
  const briefDateLabel = formatBriefDate(date ?? undefined);

  const [activeObservationDomain, setActiveObservationDomain] = useState<
    string
  >(WEATHER_DOMAINS[0].id);

  // All six domains arrive in one response, so switching a tab is instant.
  const briefs = weatherBriefs.data?.data ?? [];
  const weatherBrief =
    briefs.find((brief) => brief.domain === weatherDomain) ?? null;
  const macroBrief = briefs.find((brief) => brief.domain === "macro") ?? null;
  const climateBrief = climate.data?.data ?? null;
  const observationsData = observations.data?.data ?? undefined;

  const activeWeatherDomain =
    WEATHER_DOMAINS.find((domain) => domain.id === weatherDomain) ??
    WEATHER_DOMAINS[0];
  const isMacroWeather = weatherDomain === "macro";

  // The stored climate brief currently has no Global Overview chapter. The
  // macro brief's executive summary is the closest deterministic fallback.
  const overviewFallback = cleanBriefText(
    macroBrief?.human_brief.executive_summary ?? ""
  );

  return (
    <div className="flex flex-1 flex-col gap-4">
      <header className="mb-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            General intelligence
          </h1>

          <Badge variant="outline" className="gap-1">
            <CalendarDays className="size-3" />
            {latest ? "Latest available" : briefDateLabel ?? "Today"}
          </Badge>
        </div>

        <p className="mt-2 max-w-4xl text-muted-foreground">
          The broader economic, political, technological, and industrial
          environment that affects markets. Expand a section to read it, and
          change the briefing date in the sidebar to load another snapshot.
        </p>
      </header>

      <GeneralSection
        index={1}
        title="Climate brief"
        description="The global overview, macro and market regime, important stories and narratives, trends and capital direction, and the outlook, risks, and uncertainties."
      >
        <ClimateBriefSection
          brief={climateBrief}
          isLoading={climate.isLoading}
          error={climate.error}
          isFallback={climate.data?.isFallback ?? false}
          dateLabel={briefDateLabel}
          latest={latest}
          showHeading={false}
          includeSectorConditions={false}
          overviewFallback={overviewFallback}
          badgeLabel="Climate brief"
          cardTitle="Climate intelligence brief"
          cardDescription="AI-generated synthesis of the latest climate intelligence set, organized into the core briefing chapters. Treat it as interpretation, not live market data."
        />
      </GeneralSection>

      <GeneralSection
        index={2}
        title="Weather briefs"
        description="Six domain-specific briefs: macro, financial markets, geopolitics, AI and technology, commodities and energy, and crypto. Pick a domain to read its market regime, key sections, and outlook."
      >
        <div className="space-y-4">
          <WeatherDomainTabs
            activeDomain={weatherDomain}
            onDomainChange={setWeatherDomain}
          />

          <WeatherBriefSection
            brief={weatherBrief}
            isLoading={weatherBriefs.isLoading}
            error={weatherBriefs.error}
            isFallback={weatherBriefs.data?.isFallback ?? false}
            dateLabel={briefDateLabel}
            latest={latest}
            showHeading={false}
            showExecutiveSummary={!isMacroWeather}
            cardTitle={
              isMacroWeather
                ? "Macro & market brief"
                : `${activeWeatherDomain.label} brief`
            }
            cardDescription={
              isMacroWeather
                ? "The latest stored macro brief behind this snapshot. Its executive summary opens the Climate brief above."
                : `What Weather flagged in ${activeWeatherDomain.label.toLowerCase()} on this briefing date: the market regime, key sections, and market outlook.`
            }
          />
        </div>
      </GeneralSection>

      <GeneralSection
        index={3}
        title="Indicators"
        description="The full indicator catalogue, split by domain and then by category, with the latest stored reading for each indicator."
      >
        <IndicatorExplorer />
      </GeneralSection>

      <GeneralSection
        index={4}
        id="latest-observations"
        title="Observations and research"
        description="Recent observations from Weather, research generated from important observations, and links to the source evidence behind that research."
      >
        <ObservationsResearchSection
          data={observationsData}
          isLoading={observations.isLoading}
          error={observations.error}
          isFallback={observations.data?.isFallback ?? false}
          dateLabel={briefDateLabel}
          latest={latest}
          showHeading={false}
          activeDomain={activeObservationDomain}
          onDomainChange={setActiveObservationDomain}
          cardTitle="Latest observations and research"
          cardDescription="Stored observations and the research generated for them. Select a domain to explore its data."
        />
      </GeneralSection>
    </div>
  );
}
