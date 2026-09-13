"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ScanResult } from "@manhar-garba/ui";
import { SyncStatusBar } from "@/components/scanner/SyncStatusBar";
import { ModeToggle } from "@/components/scanner/ModeToggle";
import { Onboarding } from "@/components/scanner/Onboarding";
import { GateIdentityBar } from "@/components/scanner/GateIdentityBar";
import { useGateSession } from "@/components/scanner/GateSessionGuard";
import { validateScan } from "@/lib/validate";
import { getManifest, syncManifest } from "@/lib/manifest";
import {
  loadSettings, saveSettings,
  incrementTonightCount, logScan,
  getPendingQueue, DEFAULT_SETTINGS,
} from "@/lib/db";
import { queueCheckIn, flushQueue } from "@/lib/queue";
import { getDeviceId } from "@/lib/device-id";
import { playAllowed, playAlreadyIn, playError } from "@/lib/audio";
import { hapticAllowed, hapticAlreadyIn, hapticError } from "@/lib/haptics";
import type { ValidationResult } from "@/lib/validate";
import type { ScanManifestEntry } from "@manhar-garba/mock-data";
import { gateZones, zones as allZones, gates as allGates } from "@manhar-garba/mock-data";
import { Keyboard, ClipboardList } from "lucide-react";
import { toast } from "@manhar-garba/ui";

// Dynamically load the camera component (browser-only)
const ScanViewport = dynamic(
  () => import("@/components/scanner/ScanViewport").then((m) => ({ default: m.ScanViewport })),
  { ssr: false, loading: () => <div className="flex-1 bg-black" /> }
);

export default function ScanPage() {
  // Guaranteed non-null: /scan/layout.tsx wraps this in <GateSessionGuard>.
  const session = useGateSession();
  const [manifest, setManifest] = useState<ScanManifestEntry[]>([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [scanResult, setScanResult] = useState<ValidationResult | null>(null);
  const [mode, setMode] = useState<"in" | "out">("in");
  const [isOnline, setIsOnline] = useState(true);
  const [queueDepth, setQueueDepth] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [ready, setReady] = useState(false);
  const scanningRef = useRef(true);

  useEffect(() => {
    async function init() {
      const s = await loadSettings();
      const deviceId = getDeviceId();

      // The gate this phone scans for comes from who signed in, not from a
      // device setting — reassigning a guard to another gate is done on the
      // dashboard, and takes effect the next time they sign in.
      const gate = allGates.find((g) => g.id === session.gateId);
      const zoneId = gateZones.find((gz) => gz.gate_id === session.gateId)?.zone_id;
      const zone = allZones.find((z) => z.id === zoneId);
      const fromSession: Partial<typeof s> = {
        gate_id: session.gateId,
        gate_name: gate?.name ?? session.gateLabel,
        zone_id: zone?.id ?? s.zone_id,
        zone_name: zone?.name ?? s.zone_name,
        zone_color: zone?.color ?? s.zone_color,
      };

      await saveSettings({ device_id: deviceId, ...fromSession });
      setSettings({ ...s, ...fromSession, device_id: deviceId });
      if (!s.onboarding_done) setShowOnboarding(true);

      const m = await getManifest();
      setManifest(m);
      setReady(true);
    }
    init();

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [session]);

  // Poll pending queue depth
  useEffect(() => {
    const id = setInterval(async () => {
      const q = await getPendingQueue();
      setQueueDepth(q.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Auto-flush when online (mock sync)
  useEffect(() => {
    if (!isOnline) return;
    flushQueue().then(() => setQueueDepth(0)).catch(() => {});
  }, [isOnline]);

  async function handleDecode(qrPayload: string) {
    if (!scanningRef.current || scanResult) return;
    scanningRef.current = false;

    // Perform local validation — NO network call on this path
    const result = validateScan(qrPayload, settings.night_id, settings.zone_id, settings.zone_name, manifest);
    setScanResult(result);

    const isAllow = result.verdict === "allowed" || result.verdict === "allowed_partial";
    const isWarn = result.verdict === "already_in";

    // Feedback
    if (isAllow) { playAllowed(); hapticAllowed(); }
    else if (isWarn) { playAlreadyIn(); hapticAlreadyIn(); }
    else { playError(); hapticError(); }

    // Record to queue
    if (isAllow && result.passCode) {
      const entry = manifest.find((e) => e.qr_payload === qrPayload || e.pass_code === result.passCode);
      if (entry) {
        await incrementTonightCount(entry.pass_code);
        // Optimistically update local manifest
        setManifest((prev) => prev.map((e) =>
          e.pass_code === entry.pass_code
            ? { ...e, tonight_checkin_count: e.tonight_checkin_count + 1 }
            : e
        ));
        await queueCheckIn(entry.pass_id, entry.pass_code, mode, "allowed", null, {
          gate_id: settings.gate_id,
          zone_id: settings.zone_id,
          night_id: settings.night_id,
          staff_id: session.staffId,
        });
      }
    } else if (result.passCode) {
      const entry = manifest.find((e) => e.pass_code === result.passCode);
      if (entry) {
        await queueCheckIn(entry.pass_id, entry.pass_code, mode, "denied", result.verdict, {
          gate_id: settings.gate_id,
          zone_id: settings.zone_id,
          night_id: settings.night_id,
          staff_id: session.staffId,
        });
      }
    }

    await logScan({
      scanned_at: new Date().toISOString(),
      pass_code: result.passCode ?? qrPayload.slice(0, 20),
      verdict: result.verdict,
      holder_name: result.holderName,
      direction: mode,
      is_manual: false,
    });
  }

  function dismissResult() {
    setScanResult(null);
    scanningRef.current = true;
  }

  async function handleSync() {
    const { entries } = await syncManifest();
    const m = await getManifest();
    setManifest(m);
    const q = await getPendingQueue();
    setQueueDepth(q.length);
    if (isOnline) await flushQueue();
    toast.success(`Manifest synced — ${entries} passes loaded`, {
      description: q.length === 0 ? "Queue empty, all scans synced." : `${q.length} scan${q.length === 1 ? "" : "s"} still pending upload.`,
    });
  }

  async function onboardingDone() {
    await saveSettings({ onboarding_done: true });
    setShowOnboarding(false);
  }

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading manifest…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-black select-none">
      {showOnboarding && <Onboarding onDone={onboardingDone} />}

      {/* ScanResult overlay — zero animation, instant paint */}
      {scanResult && (
        <ScanResult
          state={scanResult.verdict}
          primaryText={scanResult.primaryText}
          secondaryText={scanResult.secondaryText}
          holderPhotoUrl={scanResult.holderPhotoUrl ?? undefined}
          onDismiss={dismissResult}
        />
      )}

      <GateIdentityBar />

      {/* Status bar */}
      <SyncStatusBar
        queueDepth={queueDepth}
        manifestLoadedAt={settings.manifest_loaded_at}
        manifestVersion={settings.manifest_version}
        isOnline={isOnline}
        onToggleOnline={() => setIsOnline((v) => !v)}
        onLongPress={() => setShowOnboarding(true)}
        onSync={handleSync}
      />

      {/* Camera viewport */}
      <ScanViewport onDecode={handleDecode} active={!scanResult && !showOnboarding} />

      {/* Bottom controls */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 safe-bottom"
        style={{ backgroundColor: "hsl(240 12% 6% / 0.95)" }}
      >
        <Link
          href="/scan/log"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-border text-muted-foreground"
          aria-label="View scan log"
        >
          <ClipboardList className="h-5 w-5" />
        </Link>

        <ModeToggle mode={mode} onChange={setMode} />

        <Link
          href="/scan/manual"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-surface-raised font-mono text-foreground text-sm font-bold"
          aria-label="Manual code entry"
        >
          <Keyboard className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
