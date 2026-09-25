"use client";
/* PWA plumbing: registers the service worker, captures the Android install prompt, and
   offers an "install" card that knows the iOS Share → Add to Home Screen route. */
import { useEffect, useSyncExternalStore, useState } from "react";
import { I } from "./icons";
import { isIOS, isStandalone, isNativeApp, haptic } from "@/lib/native";

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
let deferred: BIP | null = null;
const subs = new Set<() => void>();
const notify = () => subs.forEach((f) => f());

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
    const onBip = (e: Event) => { e.preventDefault(); deferred = e as BIP; notify(); };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);
  return null;
}

function useInstallState() {
  const promptReady = useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => !!deferred, () => false);
  const standalone = useSyncExternalStore(() => () => {}, isStandalone, () => true);
  const ios = useSyncExternalStore(() => () => {}, isIOS, () => false);
  return { promptReady, standalone, ios };
}

export function InstallCard({ compact, onDismiss }: { compact?: boolean; onDismiss?: () => void }) {
  const { promptReady, standalone, ios } = useInstallState();
  const [showHow, setShowHow] = useState(false);
  if (standalone || isNativeApp()) return null;
  const install = async () => { haptic("medium"); if (deferred) { await deferred.prompt(); await deferred.userChoice; deferred = null; notify(); } else setShowHow(true); };
  return (
    <div className={`card ${compact ? "" : "card-gold"} reveal`} style={{ marginTop: 12 }}>
      <div className="row" style={{ gap: 12 }}>
        <span className="lplay" style={{ width: 44, height: 44, background: "var(--xp-grad)", color: "#edb671" }}><img src="/icons/icon-192.png" alt="" style={{ width: 30, height: 30, borderRadius: 8 }} /></span>
        <div style={{ flex: 1 }}><h3 style={{ fontSize: 15 }}>Get the app on your home screen</h3><p className="muted" style={{ fontSize: 13, marginTop: 2 }}>Full screen, one tap, works offline for the shell. No store needed.</p></div>
        {onDismiss && <button className="iconbtn" style={{ width: 32, height: 32 }} aria-label="Dismiss" onClick={onDismiss}>{I.close}</button>}
      </div>
      <div className="row" style={{ gap: 8, marginTop: 12 }}>
        <button className="btn btn-sm" onClick={install}>{promptReady ? "Install" : ios ? "How to install" : "Install"}</button>
        {!compact && <span className="faint" style={{ fontSize: 12 }}>App Store and Google Play versions are coming.</span>}
      </div>
      {showHow && (
        <ol style={{ margin: "12px 0 0", paddingLeft: 18, fontSize: 13.5, lineHeight: 1.7, color: "var(--muted)" }}>
          {ios ? <><li>Tap the <b>Share</b> button in Safari (the square with an arrow).</li><li>Scroll and tap <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>. Ten Talents appears with the other apps.</li></> : <><li>Open the browser menu (⋮).</li><li>Tap <b>Install app</b> or <b>Add to Home screen</b>.</li></>}
        </ol>
      )}
    </div>
  );
}
