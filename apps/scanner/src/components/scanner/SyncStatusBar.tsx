"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
  queueDepth: number;
  manifestCount: number;
  manifestLoadedAt: string | null;
  manifestVersion: number;
  isOnline: boolean;
  onToggleOnline: () => void;
  onLongPress: () => void;
  onSync: () => void | Promise<void>;
}

/** How old the pass list can get before the guard should be told. */
const STALE_AFTER_MS = 18 * 60 * 60 * 1000;

function age(iso: string | null): string {
  if (!iso) return "never";
  const secs = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.round(secs / 60)}m`;
  return `${Math.round(secs / 3600)}h`;
}

export function SyncStatusBar({
  queueDepth,
  manifestCount,
  manifestLoadedAt,
  manifestVersion,
  isOnline,
  onToggleOnline,
  onLongPress,
  onSync,
}: Props) {
  const [, setTick] = useState(0);
  const [pressTimer, setPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Update the age display every 30 seconds
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  function handlePointerDown() {
    setPressTimer(setTimeout(onLongPress, 800));
  }

  function handlePointerUp() {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  }

  async function handleSync() {
    if (syncing) return;
    setSyncing(true);
    try {
      await onSync();
    } finally {
      setSyncing(false);
    }
  }

  const loadedAt = manifestLoadedAt ? new Date(manifestLoadedAt).getTime() : 0;
  const stale = loadedAt === 0 || Date.now() - loadedAt > STALE_AFTER_MS;
  const noManifest = manifestCount === 0;

  return (
    <div>
      <div
        className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs select-none"
        style={{ backgroundColor: "hsl(240 12% 6% / 0.95)" }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <button
          onClick={onToggleOnline}
          className="flex min-h-[32px] items-center gap-1.5 rounded px-1.5 transition-colors active:opacity-70"
          // Labelled as a simulation on purpose. It flips the app's idea of the
          // network, not the radio — a guard must not think tapping this is what
          // reconnects the phone.
          aria-label={
            isOnline
              ? "Demo: simulate losing the network"
              : "Demo: simulate the network coming back"
          }
        >
          {isOnline ? (
            <Wifi className="h-3.5 w-3.5 text-success" aria-hidden />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-warning" aria-hidden />
          )}
          <span className={isOnline ? "text-success" : "text-warning"}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </button>

        <span className="text-muted-foreground" aria-live="polite">
          {manifestCount} passes · v{manifestVersion > 0 ? manifestVersion.toString().slice(-4) : "—"} ·{" "}
          {age(manifestLoadedAt)} ago
        </span>

        <div className="flex items-center gap-2">
          {queueDepth > 0 && (
            <span className="rounded-full bg-warning/20 px-1.5 py-0.5 text-warning">
              {queueDepth} pending
            </span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded text-muted-foreground active:text-foreground"
            aria-label="Download the latest pass list and upload queued scans"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} aria-hidden />
          </button>
        </div>
      </div>

      {/* A phone with no list, or a list from yesterday, will reject paying
          customers all night and blame them for it. Say so where it cannot be
          missed rather than hiding it behind a version number. */}
      {(noManifest || stale) && (
        <button
          onClick={handleSync}
          className="flex w-full items-center justify-center gap-2 bg-warning px-3 py-2 text-xs font-semibold text-black"
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {noManifest
            ? "No pass list on this phone — tap to download"
            : "Pass list is over a day old — tap to refresh"}
        </button>
      )}
    </div>
  );
}
