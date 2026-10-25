"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchWeatherBrief } from "@/lib/weather-api";

export function useWeatherBrief() {
  return useQuery({
    queryKey: ["weather", "brief"],
    queryFn: fetchWeatherBrief,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}
