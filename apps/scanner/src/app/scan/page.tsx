"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ScanResult, toast } from "@manhar-garba/ui";
import { SyncStatusBar } from "@/components/scanner/SyncStatusBar";
import { ModeToggle } from "@/components/scanner/ModeToggle";
import { Onboarding } from "@/components/scanner/Onboarding";
import { GateIdentityBar } from "@/components/scanner/GateIdentityBar";
import { ScannerShell } from "@/components/scanner/ScannerShell";
import { useGateSession } from "@/components/scanner/GateSessionGuard";
import { getManifest, refreshManifest } from "@/lib/manifest";
import {
  loadSettings,
  saveSettings,
  countPending,
  loadManifest,
  DEFAULT_SETTINGS,
  type ScannerSettings,
} from "@/lib/db";
import { flushQueue } from "@/lib/queue";
import { commitScan } from "@/lib/checkin";
import { subscribeToCheckIns } from "@/lib/realtime";
import { getDeviceId } from "@/lib/device-id";
import { playAllowed, playAlreadyIn, playError } from "@/lib/audio";
import { hapticAllowed, hapticAlreadyIn, hapticError } from "@/lib/haptics";
import type { ValidationResult } from "@/lib/validate";
import { gateZones, zones as allZones, gates as allGates, EVENT_ID } from "@manhar-garba/mock-data";
import { Keyboard, ClipboardList } from "lucide-react";

// Dynamically load the camera component (browser-only). The fallback is the
// viewfinder frame rather than a black box, so the chrome doesn't jump.
const ScanViewport = dynamic(
  () => import("@/components/scanner/ScanViewport").then((m) => ({ default: m.ScanViewport })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 items-center justify-center bg-surface-sunken">
        <p className="text-sm text-muted-foreground">Starting camera…</p>
      </div>
    ),
  }
);

export default function ScanPage() {
  // Guaranteed non-null: /scan/layout.tsx wraps this in <GateSessionGuard>.
  const session = useGateSession();
  const [settings, setSettings] = useState<ScannerSettings>(DEFAULT_SETTINGS);
  const [manifestCount, setManifestCount] = useState(0);
  const [scanResult, setScanResult] = useState<ValidationResult | null>(null);
  const [mode, setMode] = useState<"in" | "out">("in");
  const [isOnline, setIsOnline] = useState(true);
  const [queueDepth, setQueueDepth] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [ready, setReady] = useState(false);
  const busyRef = useRef(false);

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
      const fromSession: Partial<ScannerSettings> = {
        gate_id: session.gateId,
        gate_name: gate?.name ?? session.gateLabel,
        zone_id: zone?.id ?? s.zone_id,
        zone_name: zone?.name ?? s.zone_name,
        zone_color: zone?.color ?? s.zone_color,
      };

      await saveSettings({ device_id: deviceId, ...fromSession });
      const next = { ...s, ...fromSession, device_id: deviceId };
      setSettings(next);
      if (!s.onboarding_done) setShowOnboarding(true);

      const m = await getManifest();
      setManifestCount(m.length);
      setQueueDepth(await countPending());
      setReady(true);
    }
    void init();
  }, [session]);

  // A phone that boots in a dead zone used to render "Online" and try to flush.
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Another scanner context on this device took an admit — reload the count so
  // this screen validates against it. See lib/realtime.ts for the honest limits.
  useEffect(() => {
    if (!ready) return;
    return subscribeToCheckIns(EVENT_ID, settings.night_id, (event) => {
      if (event.deviceId === getDeviceId()) return;
      void loadManifest().then((m) => setManifestCount(m.length));
    });
  }, [ready, settings.night_id]);

  // Poll pending queue depth
  useEffect(() => {
    const id = setInterval(() => {
      void countPending().then(setQueueDepth);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Auto-flush when online (mock sync)
  useEffect(() => {
    if (!isOnline || !ready) return;
    void flushQueue()
      .then(() => countPending().then(setQueueDepth))
      .catch(() => {});
  }, [isOnline, ready]);

  const handleDecode = useCallback(
    async (code: string) => {
      // A ref, not state: two decodes can land in the same tick and a state
      // guard would still be `false` for both of them.
      if (busyRef.current || scanResult) return;
      busyRef.current = true;

      try {
        const result = await commitScan(code, {
          settings,
          staffId: session.staffId,
          direction: mode,
          source: "qr",
        });
        setScanResult(result);

        if (result.verdict === "allowed" || result.verdict === "allowed_partial") {
          playAllowed();
          hapticAllowed();
        } else if (result.verdict === "already_in") {
          playAlreadyIn();
          hapticAlreadyIn();
        } else {
          playError();
          hapticError();
        }

        void countPending().then(setQueueDepth);
      } finally {
        busyRef.current = false;
      }
    },
    [scanResult, settings, session.staffId, mode]
  );

  function dismissResult() {
    setScanResult(null);
  }

  async function handleSync() {
    const { entries } = await refreshManifest();
    setManifestCount(entries);

    if (!isOnline) {
      const pending = await countPending();
      setQueueDepth(pending);
      toast.warning(`Pass list refreshed — ${entries} passes`, {
        description:
          pending === 0
            ? "No signal, but nothing is waiting to upload."
            : `No signal — ${pending} scan${pending === 1 ? "" : "s"} will upload when it returns.`,
      });
      return;
    }

    const { synced, failed } = await flushQueue();
    const pending = await countPending();
    setQueueDepth(pending);

    if (failed > 0) {
      toast.error(`${failed} scan${failed === 1 ? "" : "s"} could not upload`, {
        description: "They are still saved on this phone and will be retried.",
      });
      return;
    }
    toast.success(`Synced — ${entries} passes loaded`, {
      description:
        synced === 0
          ? "Nothing was waiting to upload."
          : `${synced} scan${synced === 1 ? "" : "s"} uploaded.`,
    });
  }

  async function onboardingDone() {
    await saveSettings({ onboarding_done: true });
    setShowOnboarding(false);
  }

  if (!ready) {
    return <ScannerShell />;
  }

  return (
    <div className="flex h-dvh flex-col bg-black select-none">
      {showOnboarding && <Onboarding onDone={onboardingDone} />}

      {/* ScanResult overlay — zero animation, instant paint */}
      {scanResult && (
        <ScanResult
          state={scanResult.verdict}
          primaryText={scanResult.primaryText}
          // The reason and the instruction, not just the reason: at a noisy gate
          // "WRONG GATE" alone leaves the guard inventing what happens next.
          secondaryText={`${scanResult.secondaryText} — ${scanResult.actionText}`}
          holderPhotoUrl={scanResult.holderPhotoUrl ?? undefined}
          onDismiss={dismissResult}
        />
      )}

      <GateIdentityBar nightLabel={settings.night_label} />

      <SyncStatusBar
        queueDepth={queueDepth}
        manifestCount={manifestCount}
        manifestLoadedAt={settings.manifest_loaded_at}
        manifestVersion={settings.manifest_version}
        isOnline={isOnline}
        onToggleOnline={() => setIsOnline((v) => !v)}
        onLongPress={() => setShowOnboarding(true)}
        onSync={handleSync}
      />

      <ScanViewport onDecode={handleDecode} active={!scanResult && !showOnboarding} />

      {/* Bottom controls */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 safe-bottom"
        style={{ backgroundColor: "hsl(240 12% 6% / 0.95)" }}
      >
        <Link
          href="/scan/log"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-border text-muted-foreground"
          aria-label="View tonight's scan log"
        >
          <ClipboardList className="h-5 w-5" aria-hidden />
        </Link>

        <ModeToggle mode={mode} onChange={setMode} />

        <Link
          href="/scan/manual"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-surface-raised text-foreground"
          aria-label="Enter a pass code by hand"
        >
          <Keyboard className="h-5 w-5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
