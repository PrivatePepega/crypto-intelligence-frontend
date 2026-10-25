"use client";

import { useSyncExternalStore } from "react";

import { getTodayApiDate } from "@/lib/brief-query";

const subscribe = () => () => {};

/**
 * The browser's current `YYYY-MM-DD` date.
 *
 * Returns `null` on the server so the statically rendered page never bakes in
 * the build date, and switches to the real date right after hydration.
 */
export function useTodayApiDate(): string | null {
  return useSyncExternalStore(subscribe, getTodayApiDate, () => null);
}
