/* Native-shell awareness + haptics. The Capacitor build appends "TenTalentsApp" to the
   user agent (capacitor.config.ts) and exposes window.Capacitor. Inside that shell the
   membership purchase is hidden (Apple guideline 3.1.1): membership is bought on the web. */

export const NATIVE_UA = "TenTalentsApp";

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  return new RegExp(NATIVE_UA).test(navigator.userAgent) || !!w.Capacitor?.isNativePlatform?.();
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.("(display-mode: standalone)").matches || nav.standalone === true || isNativeApp();
}

export const isIOS = () => typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;

let last = 0;
/** Light, medium, selection or success. Native haptics in the app shell; vibrate API elsewhere; silent where unsupported. */
export async function haptic(kind: "light" | "medium" | "selection" | "success" = "light") {
  const now = Date.now(); if (now - last < 40) return; last = now;
  try {
    if (isNativeApp()) {
      const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
      if (kind === "success") await Haptics.notification({ type: NotificationType.Success });
      else if (kind === "selection") await Haptics.selectionStart();
      else await Haptics.impact({ style: kind === "medium" ? ImpactStyle.Medium : ImpactStyle.Light });
      return;
    }
    navigator.vibrate?.(kind === "success" ? [8, 30, 12] : kind === "medium" ? 14 : 6);
  } catch { /* no haptics here */ }
}

/** Share sheet: native on the app shell, Web Share elsewhere, clipboard as the last resort. */
export async function share(text: string, url?: string): Promise<"shared" | "copied" | "cancelled"> {
  try {
    if (isNativeApp()) { const { Share } = await import("@capacitor/share"); await Share.share({ text, url }); return "shared"; }
    if (navigator.share) { await navigator.share({ text, url }); return "shared"; }
    await navigator.clipboard.writeText(url ? `${text} ${url}` : text); return "copied";
  } catch { return "cancelled"; }
}
