"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ScanResult } from "@manhar-garba/ui";
import { ManualCodeEntry } from "@/components/scanner/ManualCodeEntry";
import { ModeToggle } from "@/components/scanner/ModeToggle";
import { useGateSession } from "@/components/scanner/GateSessionGuard";
import { loadSettings, loadManifest, DEFAULT_SETTINGS, type ScannerSettings } from "@/lib/db";
import { getManifest } from "@/lib/manifest";
import { commitScan } from "@/lib/checkin";
import { playAllowed, playAlreadyIn, playError } from "@/lib/audio";
import { hapticAllowed, hapticAlreadyIn, hapticError } from "@/lib/haptics";
import type { ValidationResult } from "@/lib/validate";

export default function ManualPage() {
  const router = useRouter();
  const session = useGateSession();
  const [settings, setSettings] = useState<ScannerSettings>(DEFAULT_SETTINGS);
  const [manifestCount, setManifestCount] = useState<number | null>(null);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [mode, setMode] = useState<"in" | "out">("in");
  const busyRef = useRef(false);

  useEffect(() => {
    void (async () => {
      const [s, m] = await Promise.all([loadSettings(), getManifest()]);
      setSettings(s);
      setManifestCount(m.length);
    })();
  }, []);

  async function handleCode(code: string) {
    // A double-tap on Validate used to run the whole path twice, and because
    // this screen kept its own stale copy of the manifest it happily admitted
    // both times. Both halves of that are fixed: one in flight at a time, and
    // the decision is made against IndexedDB inside commitScan.
    if (busyRef.current) return;
    busyRef.current = true;

    try {
      const r = await commitScan(code, {
        settings,
        staffId: session.staffId,
        direction: mode,
        source: "manual",
      });
      setResult(r);

      if (r.verdict === "allowed" || r.verdict === "allowed_partial") {
        playAllowed();
        hapticAllowed();
      } else if (r.verdict === "already_in") {
        playAlreadyIn();
        hapticAlreadyIn();
      } else {
        playError();
        hapticError();
      }

      setManifestCount((await loadManifest()).length);
    } finally {
      busyRef.current = false;
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button
          onClick={() => router.back()}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-muted-foreground"
          aria-label="Back to camera"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
        <h1 className="flex-1 text-base font-semibold text-foreground">Type a pass code</h1>
        <ModeToggle mode={mode} onChange={setMode} />
      </div>

      {result && (
        <ScanResult
          state={result.verdict}
          primaryText={result.primaryText}
          secondaryText={`${result.secondaryText} — ${result.actionText}`}
          holderPhotoUrl={result.holderPhotoUrl ?? undefined}
          onDismiss={() => setResult(null)}
        />
      )}

      <div className="border-b border-border/50 px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Gate <span className="font-medium text-foreground">{settings.gate_name}</span>
          {" · "}
          <span className="font-medium text-foreground">{settings.night_label}</span>
          {manifestCount !== null && (
            <>
              {" · "}
              {manifestCount} pass{manifestCount === 1 ? "" : "es"} on this phone
            </>
          )}
        </p>
        {manifestCount === 0 && (
          <p
            role="alert"
            className="mt-2 rounded-lg border border-warning/40 bg-warning/10 p-2 text-xs text-foreground"
          >
            No pass list on this phone yet. Go back and tap sync at the top —
            nothing can be checked until it downloads.
          </p>
        )}
      </div>

      <ManualCodeEntry onSubmit={handleCode} onCancel={() => router.back()} />
    </div>
  );
}
