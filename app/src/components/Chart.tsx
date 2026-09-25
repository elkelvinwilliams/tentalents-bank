"use client";
/* Charts: TradingView lightweight-charts for candles (loaded on demand, client only) and a
   tiny SVG sparkline for equity curves. Both follow the design tokens in light and dark. */
import { useEffect, useRef } from "react";
import type { Candle } from "@/lib/market";

const cssVar = (n: string, fallback: string) => (typeof window === "undefined" ? fallback : getComputedStyle(document.documentElement).getPropertyValue(n).trim() || fallback);

export function Candles({ data, height = 230, decimals = 2 }: { data: Candle[]; height?: number; decimals?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el || !data.length) return;
    let chart: import("lightweight-charts").IChartApi | null = null; let ro: ResizeObserver | null = null; let dead = false;
    import("lightweight-charts").then((lc) => {
      if (dead || !el) return;
      const muted = cssVar("--faint", "#8b94a1"), line = cssVar("--line", "#e8e4d8"), green = cssVar("--green", "#1f7a55"), red = cssVar("--red", "#a8452c");
      chart = lc.createChart(el, {
        width: el.clientWidth, height,
        layout: { background: { type: lc.ColorType.Solid, color: "transparent" }, textColor: muted, fontFamily: "Inter, system-ui, sans-serif", fontSize: 11, attributionLogo: false },
        grid: { vertLines: { color: line }, horzLines: { color: line } },
        rightPriceScale: { borderVisible: false }, timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
        crosshair: { mode: lc.CrosshairMode.Magnet, vertLine: { color: cssVar("--gold", "#9a6f18"), labelBackgroundColor: cssVar("--navy", "#011936") }, horzLine: { color: cssVar("--gold", "#9a6f18"), labelBackgroundColor: cssVar("--navy", "#011936") } },
        handleScroll: { pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false }, handleScale: { axisPressedMouseMove: true, pinch: true, mouseWheel: true },
        localization: { priceFormatter: (p: number) => p.toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) },
      });
      const series = chart.addSeries(lc.CandlestickSeries, { upColor: green, downColor: red, borderVisible: false, wickUpColor: green, wickDownColor: red, priceFormat: { type: "price", precision: decimals, minMove: 1 / Math.pow(10, decimals) } });
      series.setData(data.map((c) => ({ time: c.t as import("lightweight-charts").UTCTimestamp, open: c.o, high: c.h, low: c.l, close: c.c })));
      chart.timeScale().fitContent();
      ro = new ResizeObserver(() => chart && chart.applyOptions({ width: el.clientWidth }));
      ro.observe(el);
    });
    return () => { dead = true; ro?.disconnect(); chart?.remove(); };
  }, [data, height, decimals]);
  return <div ref={ref} className="chart" style={{ height, width: "100%" }} />;
}

export function Spark({ values, height = 44, color = "#edb671", fill = true }: { values: number[]; height?: number; color?: string; fill?: boolean }) {
  if (values.length < 2) return <svg width="100%" height={height} aria-hidden="true" />;
  const W = 120, mn = Math.min(...values), mx = Math.max(...values), pad = (mx - mn) * 0.15 || 1, lo = mn - pad, hi = mx + pad;
  const X = (i: number) => (i / (values.length - 1)) * W, Y = (v: number) => height - ((v - lo) / (hi - lo)) * height;
  const pts = values.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const id = "sp" + Math.abs(values[0] + values.length).toString(36);
  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".35" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {fill && <polygon points={`0,${height} ${pts} ${W},${height}`} fill={`url(#${id})`} />}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
