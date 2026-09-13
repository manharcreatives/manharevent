import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";
import { defaultCache } from "@serwist/next/worker";

/**
 * Source of `public/sw.js` — edit this file, never the generated one.
 * `next build` regenerates `public/sw.js` from here via `@serwist/next`
 * (see next.config.ts), so any hand edit there is lost on the next build.
 */

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,

  // A gate phone may not be reopened between nights, and a worker that hangs
  // around waiting for every tab to close is a worker that never updates —
  // which, on the one device that has to keep working when everything else is
  // down, is a worse outcome than a mid-session asset swap. The reload is still
  // offered rather than forced: see ServiceWorkerManager.tsx.
  skipWaiting: true,
  clientsClaim: true,

  // Off on purpose. Preloading a navigation means every screen change waits on
  // a network request that, at a gate, is usually a timeout.
  navigationPreload: false,

  // Scoping the cache to the build means a new deploy cannot serve a mix of old
  // and new chunks; the previous build's caches are dropped on activate.
  cacheId: `manhar-scanner-${process.env.NEXT_PUBLIC_BUILD_ID ?? "dev"}`,

  runtimeCaching: defaultCache,

  // Without this, a navigation that misses the cache with no network gets the
  // browser's own error page and the guard concludes the scanner is dead.
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
