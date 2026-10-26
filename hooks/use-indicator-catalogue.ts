"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchIndicatorCatalogue } from "@/lib/indicator-api";

/**
 * The indicator catalogue changes rarely, so it is cached for longer than the
 * per-category value queries.
 */
export function useIndicatorCatalogue() {
  return useQuery({
    queryKey: ["indicators", "catalogue"],
    queryFn: fetchIndicatorCatalogue,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}
