"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScanLog } from "@/components/scanner/ScanLog";
import { getSessionLog, loadSettings, pruneSessionLog } from "@/lib/db";
import type { SessionLogEntry } from "@/lib/db";
import { ArrowLeft, RefreshCw } from "lucide-react";

export default function LogPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<SessionLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    // Nine nights on one phone is nine nights of rows; last night's scans in
    // tonight's totals are worse than useless to a supervisor doing a headcount.
    const settings = await loadSettings();
    await pruneSessionLog(settings.night_id);
    setEntries(await getSessionLog());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button
          onClick={() => router.back()}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-muted-foreground"
          aria-label="Back to scanner"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-base font-semibold text-foreground">Tonight&apos;s scans</h1>
        <button
          onClick={load}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-muted-foreground"
          aria-label="Reload the list"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Stats bar */}
      {entries.length > 0 && (
        <div className="flex gap-4 border-b border-border px-4 py-2 text-xs text-muted-foreground">
          <span>
            <span className="font-medium text-success">
              {entries.filter((e) => e.verdict === "allowed" || e.verdict === "allowed_partial").length}
            </span>{" "}
            admitted
          </span>
          <span>
            <span className="font-medium text-warning">
              {entries.filter((e) => e.verdict === "already_in").length}
            </span>{" "}
            already in
          </span>
          <span>
            <span className="font-medium text-destructive">
              {entries.filter((e) => !["allowed", "allowed_partial", "already_in"].includes(e.verdict)).length}
            </span>{" "}
            denied
          </span>
          <span className="ml-auto">{entries.length} total</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="space-y-2" aria-busy="true" aria-label="Loading scans">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-11 animate-pulse rounded-xl bg-surface-raised" />
            ))}
          </div>
        ) : (
          <ScanLog entries={entries} />
        )}
      </div>
    </div>
  );
}
