"use client";

import { useEventScope } from "@/lib/use-event";
import { downloadCsv, todayStamp } from "@/lib/export";
import { DataTable } from "@manhar-garba/ui";
import { Download } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { CheckIn } from "@manhar-garba/domain";

function timeStr(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const COLUMNS: ColumnDef<CheckIn>[] = [
  { header: "Time", accessorKey: "scanned_at", cell: ({ row }) => <span className="tabular-nums text-xs">{timeStr(row.original.scanned_at)}</span> },
  { header: "Pass", accessorKey: "pass_id", cell: ({ row }) => <span className="font-mono text-xs">{row.original.pass_id.slice(-8)}</span> },
  { header: "Direction", accessorKey: "direction", cell: ({ row }) => <span className="capitalize">{row.original.direction}</span> },
  { header: "Result", accessorKey: "result", cell: ({ row }) => (
    <span className={`capitalize text-xs font-medium ${row.original.result === "allowed" ? "text-success" : row.original.result === "denied" ? "text-destructive" : "text-warning"}`}>
      {row.original.result}
    </span>
  ) },
  { header: "Gate", accessorKey: "gate_id", cell: ({ row }) => row.original.gate_id ?? "—" },
  { header: "Device", accessorKey: "device_id", cell: ({ row }) => row.original.device_id ?? "—" },
];

export default function CheckinsPage() {
  const { event, checkIns, gates, zones } = useEventScope();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground">Check-in Log</h1>
        <button
          onClick={() =>
            downloadCsv(
              `${event?.slug ?? "event"}-checkins-${todayStamp()}`,
              ["Scanned at", "Pass", "Night", "Direction", "Result", "Reason", "Gate", "Zone", "Scanned by", "Device"],
              checkIns.map((c) => [
                c.scanned_at,
                c.pass_id,
                c.night_id,
                c.direction,
                c.result,
                c.denied_reason,
                gates.find((g) => g.id === c.gate_id)?.name ?? c.gate_id,
                zones.find((z) => z.id === c.zone_id)?.name ?? c.zone_id,
                c.scanned_by,
                c.device_id,
              ])
            )
          }
          disabled={checkIns.length === 0}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>
      <DataTable columns={COLUMNS} data={checkIns} />
    </div>
  );
}
