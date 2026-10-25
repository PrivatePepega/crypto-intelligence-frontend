"use client";

import * as React from "react";
import {
  AreaSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  type BusinessDay,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";
import { cn } from "@/lib/utils";

export interface AreaChartPoint {
  /** ISO date (YYYY-MM-DD) as returned by the indicator API. */
  time: string;
  value: number;
}

interface AreaChartProps {
  data: AreaChartPoint[];
  /** Formats the price scale, crosshair label and last value. */
  valueFormatter?: (value: number) => string;
  height?: number;
  className?: string;
  emptyMessage?: string;
}

const UP_COLOR = "#22c55e";
const DOWN_COLOR = "#ef4444";
const AXIS_TEXT_COLOR = "#71717a";
const GRID_COLOR = "rgba(113, 113, 122, 0.18)";
const CROSSHAIR_COLOR = "rgba(113, 113, 122, 0.55)";

function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

/**
 * lightweight-charts only accepts YYYY-MM-DD strings or a BusinessDay object.
 * The API can return full ISO timestamps, so normalise to the date portion.
 */
function toBusinessDay(time: string): BusinessDay | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(time);
  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function normaliseSeries(data: AreaChartPoint[]) {
  const byTime = new Map<string, { time: BusinessDay; value: number; sortKey: string }>();

  for (const point of data) {
    if (!point || typeof point.time !== "string") continue;
    if (typeof point.value !== "number" || !Number.isFinite(point.value)) continue;

    const day = toBusinessDay(point.time);
    if (!day) continue;

    const sortKey = `${day.year}-${String(day.month).padStart(2, "0")}-${String(day.day).padStart(2, "0")}`;
    // Later observations win when the same date appears twice.
    byTime.set(sortKey, { time: day, value: point.value, sortKey });
  }

  return [...byTime.values()]
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(({ time, value }) => ({ time, value }));
}

export function AreaChart({
  data,
  valueFormatter,
  height = 320,
  className,
  emptyMessage = "No historical data available",
}: AreaChartProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const chartRef = React.useRef<IChartApi | null>(null);
  const seriesRef = React.useRef<ISeriesApi<"Area"> | null>(null);
  const formatterRef = React.useRef(valueFormatter);

  React.useEffect(() => {
    formatterRef.current = valueFormatter;
  }, [valueFormatter]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const formatPrice = (price: number) =>
      formatterRef.current ? formatterRef.current(price) : price.toFixed(2);

    const chart = createChart(container, {
      autoSize: true,
      width: container.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: AXIS_TEXT_COLOR,
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: GRID_COLOR, style: LineStyle.Solid },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.15, bottom: 0.1 },
      },
      timeScale: {
        borderVisible: false,
        rightOffset: 2,
        barSpacing: 6,
        fixLeftEdge: true,
        timeVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: CROSSHAIR_COLOR,
          style: LineStyle.Dashed,
          labelBackgroundColor: AXIS_TEXT_COLOR,
        },
        horzLine: {
          color: CROSSHAIR_COLOR,
          style: LineStyle.Dashed,
          labelBackgroundColor: AXIS_TEXT_COLOR,
        },
      },
      handleScroll: { mouseWheel: false, pressedMouseMove: true },
      handleScale: { mouseWheel: false, pinch: true, axisPressedMouseMove: true },
      localization: { priceFormatter: formatPrice },
    });

    const series = chart.addSeries(AreaSeries, {
      lineWidth: 2,
      lineColor: UP_COLOR,
      topColor: withAlpha(UP_COLOR, 0.28),
      bottomColor: withAlpha(UP_COLOR, 0.02),
      crosshairMarkerRadius: 4,
      priceLineVisible: false,
      lastValueVisible: true,
      priceFormat: {
        type: "custom",
        minMove: 0.01,
        formatter: formatPrice,
      },
    });

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height]);

  React.useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    const points = normaliseSeries(data);
    const firstValue = points[0]?.value;
    const lastValue = points[points.length - 1]?.value;
    const isDown =
      firstValue !== undefined && lastValue !== undefined && lastValue < firstValue;
    const color = isDown ? DOWN_COLOR : UP_COLOR;

    series.applyOptions({
      lineColor: color,
      topColor: withAlpha(color, 0.28),
      bottomColor: withAlpha(color, 0.02),
      priceFormat: {
        type: "custom",
        minMove: 0.01,
        formatter: (price: number) =>
          formatterRef.current ? formatterRef.current(price) : price.toFixed(2),
      },
    });

    series.setData(points);
    chart.timeScale().fitContent();
  }, [data, valueFormatter]);

  const hasData = data.length > 0;

  return (
    <div
      className={cn("relative w-full", className)}
      style={{ height }}
      aria-label="Indicator history area chart"
    >
      <div ref={containerRef} className="size-full" />

      {!hasData && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

export default AreaChart;
