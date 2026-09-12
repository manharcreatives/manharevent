"use client";

import { useState } from "react";
import { Download, Search } from "lucide-react";
import type { SessionLogEntry } from "@/lib/db";

interface Props {
  entries: SessionLogEntry[];
}

const VERDICT_LABEL: Record<string, { label: string; cls: string }> = {
  allowed:         { label: "Allowed",       cls: "text-success" },
  allowed_partial: { label: "Partial",        cls: "text-success" },
  already_in:      { label: "Already in",    cls: "text-warning" },
  wrong_zone:      { label: "Wrong gate",    cls: "text-destructive" },
  wrong_night:     { label: "Wrong night",   cls: "text-destructive" },
  refunded:        { label: "Refunded",      cls: "text-destructive" },
  blocked:         { label: "Blocked",       cls: "text-destructive" },
  invalid:         { label: "Invalid",       cls: "text-destructive" },
};

function timeStr(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function exportCsv(entries: SessionLogEntry[]) {
  const header = "Time,Pass Code,Verdict,Direction,Manual\n";
  const rows = entries.map((e) =>
    [timeStr(e.scanned_at), e.pass_code, e.verdict, e.direction, e.is_manual ? "yes" : "no"].join(",")
  );
  const csv = header + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `scan-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ScanLog({ entries }: Props) {
  const [query, setQuery] = useState("");

  const filtered = query
    ? entries.filter(
        (e) =>
          e.pass_code.toLowerCase().includes(query.toLowerCase()) ||
          e.verdict.includes(query.toLowerCase())
      )
    : entries;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search by pass code…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => exportCsv(entries)}
          className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          aria-label="Export CSV"
        >
          <Download className="h-4 w-4" />
          CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No scans this session yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
          {filtered.map((e, i) => {
            const vd = VERDICT_LABEL[e.verdict] ?? { label: e.verdict, cls: "text-muted-foreground" };
            return (
              <li key={i} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                <span className="w-20 shrink-0 tabular-nums text-xs text-muted-foreground">{timeStr(e.scanned_at)}</span>
                <span className="flex-1 font-mono text-xs text-foreground truncate">{e.pass_code}</span>
                <span className={`shrink-0 text-xs font-medium ${vd.cls}`}>{vd.label}</span>
                {e.is_manual && (
                  <span className="shrink-0 rounded-full bg-surface-raised px-1.5 py-0.5 text-xs text-muted-foreground">manual</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
