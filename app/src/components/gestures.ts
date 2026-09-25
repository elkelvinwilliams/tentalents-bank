"use client";
/* Native-feel gestures on the scrolling view: pull-to-refresh and swipe-back from the
   left edge. Touch-only; pointer devices are untouched. */
import { useEffect, type RefObject } from "react";
import { haptic } from "@/lib/native";

export function useGestures(view: RefObject<HTMLDivElement | null>, indicator: RefObject<HTMLDivElement | null>, opts: { onRefresh: () => Promise<unknown> | void; onBack: () => void; canBack: () => boolean }, enabled = true) {
  useEffect(() => {
    const el = view.current; if (!el || !enabled) return;
    let sx = 0, sy = 0, pulling = false, edge = false, dist = 0, busy = false;
    const ind = () => indicator.current;
    const start = (e: TouchEvent) => {
      const t = e.touches[0]; sx = t.clientX; sy = t.clientY; dist = 0;
      pulling = el.scrollTop <= 0 && !busy; edge = sx <= 28 && opts.canBack();
    };
    const move = (e: TouchEvent) => {
      const t = e.touches[0]; const dx = t.clientX - sx, dy = t.clientY - sy;
      if (pulling && dy > 0 && Math.abs(dx) < 30) {
        dist = Math.min(110, dy * 0.55); const i = ind();
        if (i) { i.style.transform = `translate(-50%, ${dist - 44}px) rotate(${dist * 3}deg)`; i.style.opacity = String(Math.min(1, dist / 60)); i.classList.toggle("ready", dist > 72); }
        if (dist > 8 && e.cancelable) e.preventDefault();
      } else pulling = false;
    };
    const end = async (e: TouchEvent) => {
      const t = e.changedTouches[0]; const dx = t.clientX - sx, dy = t.clientY - sy; const i = ind();
      if (pulling && dist > 72) {
        busy = true; haptic("medium");
        if (i) { i.classList.add("spin"); i.style.transform = "translate(-50%, 30px)"; }
        try { await opts.onRefresh(); } finally {
          if (i) { i.classList.remove("spin", "ready"); i.style.transform = "translate(-50%, -44px)"; i.style.opacity = "0"; }
          busy = false;
        }
      } else if (i) { i.classList.remove("ready"); i.style.transform = "translate(-50%, -44px)"; i.style.opacity = "0"; }
      pulling = false; dist = 0;
      if (edge && dx > 90 && Math.abs(dy) < 50) { haptic("light"); opts.onBack(); }
      edge = false;
    };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end, { passive: true });
    return () => { el.removeEventListener("touchstart", start); el.removeEventListener("touchmove", move); el.removeEventListener("touchend", end); };
  }, [view, indicator, opts, enabled]);
}
