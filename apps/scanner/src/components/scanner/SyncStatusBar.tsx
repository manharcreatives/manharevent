"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

interface Props {
  queueDepth: number;
  manifestLoadedAt: string | null;
  manifestVersion: number;
  isOnline: boolean;
  onToggleOnline: () => void;
  onLongPress: () => void;
  onSync: () => void;
}

function age(iso: string | null): string {
  if (!iso) return "never";
  const secs = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.round(secs / 60)}m`;
  return `${Math.round(secs / 3600)}h`;
}

export function SyncStatusBar({
  queueDepth,
  manifestLoadedAt,
  manifestVersion,
  isOnline,
  onToggleOnline,
  onLongPress,
  onSync,
}: Props) {
  const [, setTick] = useState(0);
  const [pressTimer, setPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Update the age display every 30 seconds
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  function handlePointerDown() {
    const t = setTimeout(onLongPress, 800);
    setPressTimer(t);
  }

  function handlePointerUp() {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  }

  return (
    <div
      className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs select-none cursor-pointer"
      style={{ backgroundColor: "hsl(240 12% 6% / 0.95)" }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      role="status"
      aria-label="Scanner status"
    >
      <button
        onClick={onToggleOnline}
        className="flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors active:opacity-70"
        aria-label={isOnline ? "Mock online — tap to simulate offline" : "Mock offline — tap to go online"}
      >
        {isOnline ? (
          <Wifi className="h-3 w-3 text-success" />
        ) : (
          <WifiOff className="h-3 w-3 text-warning" />
        )}
        <span className={isOnline ? "text-success" : "text-warning"}>
          {isOnline ? "Online" : "Offline"}
        </span>
      </button>

      <span className="text-muted-foreground">
        v{manifestVersion > 0 ? manifestVersion.toString().slice(-4) : "—"} · {age(manifestLoadedAt)} ago
      </span>

      <div className="flex items-center gap-2">
        {queueDepth > 0 && (
          <span className="rounded-full bg-warning/20 px-1.5 py-0.5 text-warning">
            {queueDepth} pending
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onSync(); }}
          className="rounded p-0.5 text-muted-foreground active:text-foreground"
          aria-label="Sync now"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
