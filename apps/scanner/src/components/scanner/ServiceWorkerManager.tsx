"use client";

import { useEffect, useState } from "react";
import { RefreshCw, WifiOff } from "lucide-react";

/**
 * Watches the service worker; it does not register it.
 *
 * `@serwist/next` registers `/sw.js` itself (`register: true`), so registering
 * again here would just hand back the same registration. What was missing was
 * everything around it: nothing told the guard they had gone offline, and
 * nothing told them a new build was waiting — `skipWaiting` swapped it in
 * silently on the next navigation.
 *
 * The related fix is in `next.config.ts`: serwist's `reloadOnOnline` defaults to
 * true, which reloads the whole app the instant the network returns. At a gate
 * that is a page reload in the middle of a scan queue, triggered by exactly the
 * event that is most likely to happen mid-shift. It is off.
 */
export function ServiceWorkerManager() {
  const [updateReady, setUpdateReady] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    let registration: ServiceWorkerRegistration | undefined;

    navigator.serviceWorker
      .getRegistration()
      .then((reg) => {
        if (!reg || cancelled) return;
        registration = reg;
        if (reg.waiting) setUpdateReady(true);
        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            // A controller already exists = this is a replacement, not the
            // first install, so there is genuinely something new to load.
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateReady(true);
            }
          });
        });
      })
      .catch(() => {
        // No worker means no offline cache, not a broken scanner — the pass list
        // and the queue live in IndexedDB either way.
      });

    // A shift runs for hours without a navigation, so nothing would otherwise
    // check for a new build. Hourly, so a fix pushed at 8pm is live by 9.
    const id = setInterval(() => void registration?.update().catch(() => {}), 60 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!offline && !updateReady) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex flex-col items-center gap-2 px-3">
      {offline && (
        <p className="pointer-events-auto flex items-center gap-2 rounded-full bg-warning px-3 py-1.5 text-center text-xs font-semibold text-black shadow-lg">
          <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
          No signal — scanning still works, scans upload later
        </p>
      )}
      {updateReady && (
        <button
          onClick={() => window.location.reload()}
          className="pointer-events-auto flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-lg active:scale-95"
        >
          <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden />
          New scanner version ready — tap to load
        </button>
      )}
    </div>
  );
}
