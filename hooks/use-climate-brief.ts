"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchClimateBrief } from "@/lib/climate-api";

export function useClimateBrief() {
  return useQuery({
    queryKey: ["climate", "brief"],
    queryFn: fetchClimateBrief,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}
