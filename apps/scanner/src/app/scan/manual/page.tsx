"use client";

import { useRouter } from "next/navigation";
import { ManualCodeEntry } from "@/components/scanner/ManualCodeEntry";
import { validateScan } from "@/lib/validate";
import { loadSettings, incrementTonightCount, logScan, DEFAULT_SETTINGS } from "@/lib/db";
import { getManifest } from "@/lib/manifest";
import { queueCheckIn } from "@/lib/queue";
import { playAllowed, playAlreadyIn, playError } from "@/lib/audio";
import { hapticAllowed, hapticAlreadyIn, hapticError } from "@/lib/haptics";
import { ScanResult } from "@manhar-garba/ui";
import { useState, useEffect } from "react";
import type { ValidationResult } from "@/lib/validate";
import type { ScanManifestEntry } from "@manhar-garba/mock-data";
import type { ScannerSettings } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import { useGateSession } from "@/components/scanner/GateSessionGuard";

export default function ManualPage() {
  const router = useRouter();
  const session = useGateSession();
  const [settings, setSettings] = useState<ScannerSettings>(DEFAULT_SETTINGS);
  const [manifest, setManifest] = useState<ScanManifestEntry[]>([]);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [mode] = useState<"in" | "out">("in");

  useEffect(() => {
    Promise.all([loadSettings(), getManifest()]).then(([s, m]) => {
      setSettings(s);
      setManifest(m);
    });
  }, []);

  async function handleCode(code: string) {
    const r = validateScan(code, settings.night_id, settings.zone_id, settings.zone_name, manifest);
    setResult(r);

    const isAllow = r.verdict === "allowed" || r.verdict === "allowed_partial";
    const isWarn = r.verdict === "already_in";

    if (isAllow) { playAllowed(); hapticAllowed(); }
    else if (isWarn) { playAlreadyIn(); hapticAlreadyIn(); }
    else { playError(); hapticError(); }

    if (isAllow && r.passCode) {
      const entry = manifest.find((e) => e.pass_code === r.passCode || e.qr_payload === code);
      if (entry) {
        await incrementTonightCount(entry.pass_code);
        await queueCheckIn(entry.pass_id, entry.pass_code, mode, "allowed", null, {
          gate_id: settings.gate_id,
          zone_id: settings.zone_id,
          night_id: settings.night_id,
          staff_id: session.staffId,
        });
      }
    }

    await logScan({
      scanned_at: new Date().toISOString(),
      pass_code: r.passCode ?? code.slice(0, 20),
      verdict: r.verdict,
      holder_name: r.holderName,
      direction: mode,
      is_manual: true,
    });
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button
          onClick={() => router.back()}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-muted-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold text-foreground">Manual code entry</h1>
      </div>

      {/* Result overlay */}
      {result && (
        <ScanResult
          state={result.verdict}
          primaryText={result.primaryText}
          secondaryText={result.secondaryText}
          holderPhotoUrl={result.holderPhotoUrl ?? undefined}
          onDismiss={() => setResult(null)}
        />
      )}

      {/* Gate info */}
      <div className="px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Gate: <span className="font-medium text-foreground">{settings.gate_name}</span>
          &nbsp;·&nbsp;Night: <span className="font-medium text-foreground">{settings.night_label}</span>
        </p>
      </div>

      <ManualCodeEntry onSubmit={handleCode} onCancel={() => router.back()} />
    </div>
  );
}
