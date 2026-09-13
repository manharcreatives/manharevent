"use client";

import { useState } from "react";
import { Megaphone, Moon } from "lucide-react";
import { StatTile, toast } from "@manhar-garba/ui";
import { LiveOccupancyMeter } from "@/components/dashboard/live-occupancy-meter";
import { CheckinFeed } from "@/components/dashboard/checkin-feed";
import { useDashboardStore } from "@/lib/dashboard-store";
import { useEventScope } from "@/lib/use-event";
import { currentNight, expectedAttendanceByNight, insideByZone } from "@/lib/metrics";

export default function LiveOpsPage() {
  const { event, nights, zones, passTypes, checkIns } = useEventScope();
  const addAuditEntry = useDashboardStore((s) => s.addAuditEntry);
  const [announcement, setAnnouncement] = useState("");
  const [sent, setSent] = useState<{ text: string; at: string }[]>([]);

  if (!event) return null;

  const upcoming = currentNight(nights);
  const night = upcoming?.night;
  const expected = expectedAttendanceByNight(nights, passTypes).find((n) => n.nightId === night?.id)?.value ?? 0;
  // Occupancy comes from the check-in log (entries minus exits) — it used to
  // be every zone's capacity × 0.62, which never changed.
  const occupancy = insideByZone(checkIns, zones, upcoming?.mode === "tonight" ? night?.id : undefined);
  const inside = occupancy.reduce((s, z) => s + z.current, 0);
  const denied = checkIns.filter((c) => c.result !== "allowed").length;

  function handleSend() {
    const text = announcement.trim();
    if (!text) return;
    setSent((a) => [{ text, at: new Date().toISOString() }, ...a.slice(0, 4)]);
    addAuditEntry("gate.announcement", `Gate announcement: ${text}`);
    setAnnouncement("");
    toast.success("Announcement logged", {
      description: "In the live system this pushes to every signed-in gate scanner.",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">Live ops console</h1>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Moon className="h-3.5 w-3.5" />
          {!night
            ? "No nights scheduled"
            : upcoming?.mode === "tonight"
              ? `Night ${night.night_number} is tonight · ${night.theme ?? "no theme set"}`
              : upcoming?.mode === "after"
                ? "The season is over — showing the full check-in log"
                : `Next: Night ${night.night_number} in ${upcoming?.daysAway} day${upcoming?.daysAway === 1 ? "" : "s"} · showing gate test scans`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Inside now" value={inside.toLocaleString("en-IN")} sub="Entries minus exits" className="border-primary/30" />
        <StatTile label="Expected" value={expected.toLocaleString("en-IN")} sub={night ? `Valid passes for Night ${night.night_number}` : "—"} className="border-primary/30" />
        <StatTile
          label="Turnout"
          value={expected > 0 ? `${Math.round((inside / expected) * 100)}%` : "—"}
          sub="Of people expected"
        />
        <StatTile label="Refused at gate" value={denied.toLocaleString("en-IN")} sub="Wrong zone, used, blocked" trend={denied > 0 ? "down" : "neutral"} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Zone occupancy</h2>
          {zones.length === 0 ? (
            <p className="text-sm text-muted-foreground">No zones configured.</p>
          ) : (
            <LiveOccupancyMeter zones={occupancy} />
          )}
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <CheckinFeed />
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Megaphone className="h-4 w-4" />
          Gate announcement
        </h2>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g. Gate 3 closed — send General to Gate 4"
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={!announcement.trim()}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Demo: announcements are recorded in the audit log. Delivery to gate phones arrives with the realtime backend.
        </p>
        {sent.length > 0 && (
          <ul className="space-y-1">
            {sent.map((m) => (
              <li key={m.at} className="text-xs text-muted-foreground">
                ✓ {m.text} · {new Date(m.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
