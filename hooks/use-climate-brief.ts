"use client";

import { useQuery } from "@tanstack/react-query";

import type { BriefQuery } from "@/lib/brief-query";
import { fetchClimateBrief } from "@/lib/climate-api";
import type { ClimateBrief, DatedBriefResult } from "@/types";

export function useClimateBrief({ date, latest }: BriefQuery) {
  return useQuery({
    queryKey: ["climate", "brief", latest ? "latest" : (date ?? null)],
    queryFn: async (): Promise<DatedBriefResult<ClimateBrief>> => {
      if (latest) {
        return {
          data: await fetchClimateBrief({ latest: true }),
          isFallback: false,
        };
      }

      const dated = await fetchClimateBrief({ date });

      if (dated) {
        // The climate route currently always returns the newest row. Compare
        // its stored date with the requested one so the card can say the day
        // itself had no brief instead of silently relabelling the snapshot.
        const appliedDate = dated.date.slice(0, 10);

        return {
          data: dated,
          isFallback: Boolean(date && appliedDate !== date),
        };
      }

      // The selected day has no brief. Show the newest one and flag it so the
      // UI can say the date itself had no data.
      const fallback = await fetchClimateBrief({ latest: true });

      return { data: fallback, isFallback: fallback !== null };
    },
    enabled: Boolean(latest || date),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}
