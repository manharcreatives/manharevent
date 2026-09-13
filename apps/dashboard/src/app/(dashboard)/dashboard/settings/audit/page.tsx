"use client";

import { useMemo, useState } from "react";
import {
  Download, Search, ScrollText, Rocket, EyeOff, Gift, Undo2, XCircle,
  UserPlus, UserMinus, Palette, FileText, TicketPercent, ShieldCheck, ShieldOff,
  RefreshCw, Settings2, CalendarPlus, CopyPlus, Moon, Music, MapPin, DoorOpen,
  Ticket, PackagePlus, Store, Star, Globe, Landmark, type LucideIcon,
} from "lucide-react";
import { EmptyState, Input } from "@manhar-garba/ui";
import { useDashboardStore, type AuditEntry } from "@/lib/dashboard-store";
import { downloadCsv, todayStamp } from "@/lib/export";

/**
 * Every action code the store can write, with the sentence a human would use
 * for it.
 *
 * The raw codes (`event.published`, `comp.issued`, `refund.approved`) were
 * being printed straight onto the screen, so the audit log read like a server
 * log rather than a record an organizer — or their accountant — can follow.
 * The code is still exported in the CSV, where a machine reads it.
 */
const ACTIONS: Record<string, { label: string; Icon: LucideIcon; tone: string }> = {
  "event.created":                  { label: "Event created",                Icon: CalendarPlus,  tone: "text-info" },
  "event.cloned":                   { label: "Event cloned",                 Icon: CopyPlus,      tone: "text-info" },
  "event.published":                { label: "Event published",              Icon: Rocket,        tone: "text-success" },
  "event.unpublished":              { label: "Event unpublished",            Icon: EyeOff,        tone: "text-warning" },
  "event.visibility_changed":       { label: "Public listing changed",       Icon: EyeOff,        tone: "text-warning" },
  "night.updated":                  { label: "Night updated",                Icon: Moon,          tone: "text-muted-foreground" },
  "night.lineup_updated":           { label: "Night lineup updated",         Icon: Music,         tone: "text-accent" },
  "venue.updated":                  { label: "Venue updated",                Icon: MapPin,        tone: "text-muted-foreground" },
  "zone.updated":                   { label: "Zone updated",                 Icon: MapPin,        tone: "text-muted-foreground" },
  "gate.updated":                   { label: "Gate updated",                 Icon: DoorOpen,      tone: "text-muted-foreground" },
  "pass_type.created":              { label: "Pass type created",            Icon: Ticket,        tone: "text-primary" },
  "pass_type.updated":              { label: "Pass type updated",            Icon: Ticket,        tone: "text-muted-foreground" },
  "pass_type.removed":              { label: "Pass type removed",            Icon: Ticket,        tone: "text-destructive" },
  "price_tier.created":             { label: "Price tier added",             Icon: TicketPercent, tone: "text-primary" },
  "price_tier.removed":             { label: "Price tier removed",           Icon: TicketPercent, tone: "text-destructive" },
  "addon.created":                  { label: "Add-on created",               Icon: PackagePlus,   tone: "text-primary" },
  "addon.updated":                  { label: "Add-on updated",               Icon: PackagePlus,   tone: "text-muted-foreground" },
  "addon.removed":                  { label: "Add-on removed",               Icon: PackagePlus,   tone: "text-destructive" },
  "promo.created":                  { label: "Promo code created",           Icon: TicketPercent, tone: "text-primary" },
  "comp.issued":                    { label: "Comp passes issued",           Icon: Gift,          tone: "text-primary" },
  "refund.approved":                { label: "Refund approved",              Icon: Undo2,         tone: "text-warning" },
  "refund.rejected":                { label: "Refund rejected",              Icon: XCircle,       tone: "text-destructive" },
  "policy.updated":                 { label: "Refund / re-entry policy updated", Icon: FileText,  tone: "text-muted-foreground" },
  "team.added":                     { label: "Team member added",            Icon: UserPlus,      tone: "text-info" },
  "team.removed":                   { label: "Team member removed",          Icon: UserMinus,     tone: "text-destructive" },
  "scanner_credential.issued":      { label: "Scanner access issued",        Icon: ShieldCheck,   tone: "text-success" },
  "scanner_credential.revoked":     { label: "Scanner access revoked",       Icon: ShieldOff,     tone: "text-destructive" },
  "scanner_credential.regenerated": { label: "Scanner code replaced",        Icon: RefreshCw,     tone: "text-warning" },
  "vendor.added":                   { label: "Vendor added",                 Icon: Store,         tone: "text-info" },
  "vendor.updated":                 { label: "Vendor updated",               Icon: Store,         tone: "text-muted-foreground" },
  "vendor.removed":                 { label: "Vendor removed",               Icon: Store,         tone: "text-destructive" },
  "sponsor.added":                  { label: "Sponsor added",                Icon: Star,          tone: "text-info" },
  "sponsor.updated":                { label: "Sponsor updated",              Icon: Star,          tone: "text-muted-foreground" },
  "sponsor.removed":                { label: "Sponsor removed",              Icon: Star,          tone: "text-destructive" },
  "branding.updated":               { label: "Branding updated",             Icon: Palette,       tone: "text-accent" },
  "domain.updated":                 { label: "Domain changed",               Icon: Globe,         tone: "text-info" },
  "domain.verified":                { label: "Domain verified",              Icon: Globe,         tone: "text-success" },
  "payout_account.updated":         { label: "Payout account updated",       Icon: Landmark,      tone: "text-info" },
  "notifications.updated":          { label: "Notification settings changed", Icon: Settings2,    tone: "text-muted-foreground" },
};

/** An unmapped code should still read as a sentence, not as `foo.bar_baz`. */
function describe(action: string) {
  const known = ACTIONS[action];
  if (known) return known;
  const words = action.replace(/[._]/g, " ");
  return {
    label: words.charAt(0).toUpperCase() + words.slice(1),
    Icon: ScrollText,
    tone: "text-muted-foreground",
  };
}

function timeStr(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function dayStr(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) return "Today";
  const yesterday = new Date(today.getTime() - 86_400_000);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default function AuditPage() {
  const auditLog = useDashboardStore((s) => s.auditLog);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return auditLog;
    return auditLog.filter((e) =>
      `${describe(e.action).label} ${e.action} ${e.actor} ${e.detail}`.toLowerCase().includes(q)
    );
  }, [auditLog, query]);

  // Grouped by day, because "what happened on night four" is the question this
  // page gets opened for.
  const groups = useMemo(() => {
    const out: { day: string; entries: AuditEntry[] }[] = [];
    for (const entry of filtered) {
      const day = dayStr(entry.timestamp);
      const last = out[out.length - 1];
      if (last && last.day === day) last.entries.push(entry);
      else out.push({ day, entries: [entry] });
    }
    return out;
  }, [filtered]);

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Audit log</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every change anyone on your team made, with who made it and when. It cannot be edited or deleted.
          </p>
        </div>
        <button
          onClick={() =>
            downloadCsv(
              `audit-log-${todayStamp()}`,
              ["Timestamp", "Action", "Action code", "Actor", "Detail"],
              filtered.map((e) => [e.timestamp, describe(e.action).label, e.action, e.actor, e.detail])
            )
          }
          disabled={filtered.length === 0}
          className="flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {auditLog.length > 0 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by person, action or detail"
            aria-label="Search the audit log"
            className="h-11 pl-9"
          />
        </div>
      )}

      {auditLog.length === 0 ? (
        <EmptyState
          icon={<ScrollText />}
          title="Nothing logged yet"
          description="Publishing an event, approving a refund, issuing a scanner code or changing your team all write a line here automatically."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search />}
          title="No entries match that"
          description={`Nothing in the log mentions "${query.trim()}". Clear the search to see all ${auditLog.length} entries.`}
        />
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.day}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.day}
              </h2>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
                {group.entries.map((entry) => {
                  const { label, Icon, tone } = describe(entry.action);
                  return (
                    <li key={entry.id} className="flex items-start gap-3 px-4 py-3">
                      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-raised ${tone}`}>
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{label}</p>
                        <p className="text-sm text-muted-foreground">{entry.detail}</p>
                        <p className="mt-0.5 text-xs text-placeholder">
                          {entry.actor} · {timeStr(entry.timestamp)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
