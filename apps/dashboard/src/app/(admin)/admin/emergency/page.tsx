"use client";

import { useState } from "react";
import {
  PauseCircle,
  PlayCircle,
  Snowflake,
  ShieldOff,
  WifiOff,
  Ban,
  Megaphone,
  History,
  CheckCircle2,
} from "lucide-react";
import { Button, Input, Field, Badge, toast } from "@manhar-garba/ui";
import { tenant as manharTenant, event as manharEvent } from "@manhar-garba/mock-data";
import { DangerConfirm } from "@/components/admin/danger-confirm";
import { HydrationGate } from "@/components/dashboard/hydration-gate";
import { usePlatformStore, type EmergencyKind } from "@/lib/platform-store";

type DialogId =
  | "pause_sales"
  | "resume_sales"
  | "freeze"
  | "revoke_scanners"
  | "offline_allow"
  | null;

const KIND_LABEL: Record<EmergencyKind, string> = {
  sales_paused: "Sales paused",
  tenant_frozen: "Tenant frozen",
  scanners_revoked: "Scanners revoked",
  offline_allow: "Offline-allow mode",
  pass_blocked: "Pass blocked",
  banner: "Site banner",
};

/**
 * The screen someone opens at 10pm on night four when something has gone
 * wrong: a card machine is double-charging, a scanner phone was stolen, the
 * venue's uplink died, or a pass is being passed back over the fence.
 *
 * Everything here is destructive and reaches real attendees, so every control
 * demands a typed phrase and a written reason, and every use is logged
 * permanently at the bottom of this page.
 */
export default function EmergencyPage() {
  // Everything below reads the persisted platform store, and the audit trail
  // renders timestamps — both differ between the server's build-time render
  // and the browser's, which is what threw React #418 here.
  return (
    <HydrationGate>
      <EmergencyControls />
    </HydrationGate>
  );
}

function EmergencyControls() {
  const store = usePlatformStore();
  const [dialog, setDialog] = useState<DialogId>(null);
  const [passCode, setPassCode] = useState("");
  const [banner, setBanner] = useState("");

  const tenantId = manharTenant.id;
  const tenantName = manharTenant.display_name;
  const frozen = store.frozenTenantIds.includes(tenantId);
  const offlineAllow = store.offlineAllowEventIds.includes(manharEvent.id);
  const activeBanner = store.banners[tenantId];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Emergency controls</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform-wide overrides. Every action here is logged with who did it and why, and takes
          effect for real attendees immediately.
        </p>
      </div>

      {/* ── Ticket sales ─────────────────────────────────────────────── */}
      <Card
        icon={store.salesPausedGlobally ? <PauseCircle className="text-destructive" /> : <PauseCircle />}
        title="Ticket sales"
        status={
          store.salesPausedGlobally ? (
            <Badge variant="destructive">Paused platform-wide</Badge>
          ) : (
            <Badge variant="success">Selling normally</Badge>
          )
        }
        body="Stops checkout on every organizer's site at once. Orders already paid are unaffected; anyone mid-checkout sees a 'sales paused' notice instead of the payment screen."
        action={
          store.salesPausedGlobally ? (
            <Button
              size="sm"
              onClick={() => {
                store.setGlobalSalesPause(false, "Sales resumed by platform ops");
                toast.success("Ticket sales resumed everywhere");
              }}
            >
              <PlayCircle className="mr-1.5 h-4 w-4" />
              Resume sales
            </Button>
          ) : (
            <Button size="sm" variant="destructive" onClick={() => setDialog("pause_sales")}>
              <PauseCircle className="mr-1.5 h-4 w-4" />
              Pause all sales
            </Button>
          )
        }
      />

      {/* ── Tenant freeze ────────────────────────────────────────────── */}
      <Card
        icon={<Snowflake className={frozen ? "text-destructive" : undefined} />}
        title={`Freeze ${tenantName}`}
        status={frozen ? <Badge variant="destructive">Frozen</Badge> : <Badge>Active</Badge>}
        body="Suspends this organizer's dashboard and takes their public site offline. Use it for a payment dispute, a licensing problem, or a police instruction — not for a support question."
        action={
          frozen ? (
            <Button
              size="sm"
              onClick={() => {
                store.unfreezeTenant(tenantId, tenantName);
                toast.success(`${tenantName} unfrozen`);
              }}
            >
              Lift freeze
            </Button>
          ) : (
            <Button size="sm" variant="destructive" onClick={() => setDialog("freeze")}>
              <Snowflake className="mr-1.5 h-4 w-4" />
              Freeze tenant
            </Button>
          )
        }
      />

      {/* ── Scanner revocation ───────────────────────────────────────── */}
      <Card
        icon={<ShieldOff />}
        title="Revoke every scanner login"
        status={<Badge variant="warning">Not reversible from here</Badge>}
        body="Signs out every gate device for this event at its next sync. Use it when a staff phone is lost or a code has been shared around. The organizer then re-issues access one person at a time from their Team page — on purpose, so a mass revoke can't be quietly undone."
        action={
          <Button size="sm" variant="destructive" onClick={() => setDialog("revoke_scanners")}>
            <ShieldOff className="mr-1.5 h-4 w-4" />
            Revoke all scanners
          </Button>
        }
      />

      {/* ── Offline-allow ────────────────────────────────────────────── */}
      <Card
        icon={<WifiOff className={offlineAllow ? "text-warning" : undefined} />}
        title="Offline-allow mode at the gates"
        status={
          offlineAllow ? <Badge variant="warning">On — gates admitting offline</Badge> : <Badge>Off</Badge>
        }
        body="When the venue's network dies, gates admit any pass with a valid signature and reconcile later. It keeps the queue moving, and it means a duplicated pass can get two people in until the next sync. Turn it off the moment connectivity is back."
        action={
          offlineAllow ? (
            <Button
              size="sm"
              onClick={() => {
                store.setOfflineAllow(manharEvent.id, manharEvent.title, false, "Connectivity restored");
                toast.success("Offline-allow mode turned off");
              }}
            >
              Turn off
            </Button>
          ) : (
            <Button size="sm" variant="destructive" onClick={() => setDialog("offline_allow")}>
              <WifiOff className="mr-1.5 h-4 w-4" />
              Turn on offline-allow
            </Button>
          )
        }
      />

      {/* ── Block a pass ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-raised text-muted-foreground">
            <Ban className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="font-medium text-foreground">Block a pass</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Refuses one pass at every gate — a chargeback, a counterfeit, or a pass being handed
                back over the fence. The holder sees a red DENIED with &ldquo;call supervisor&rdquo;.
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <Input
                value={passCode}
                onChange={(e) => setPassCode(e.target.value.toUpperCase())}
                placeholder="MNH-8F2K-QX41"
                className="h-9 w-56 font-mono"
              />
              <Button
                size="sm"
                variant="destructive"
                disabled={passCode.trim().length < 4}
                onClick={() => {
                  store.blockPass(passCode.trim(), "Blocked by platform ops");
                  toast.success(`${passCode.trim()} blocked at every gate`);
                  setPassCode("");
                }}
              >
                Block pass
              </Button>
            </div>

            {store.blockedPassCodes.length > 0 && (
              <ul className="space-y-1.5 pt-1">
                {store.blockedPassCodes.map((code) => (
                  <li key={code} className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-foreground">{code}</span>
                    <button
                      onClick={() => {
                        store.unblockPass(code);
                        toast.success(`${code} unblocked`);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Unblock
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ── Banner ───────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-raised text-muted-foreground">
            <Megaphone className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="font-medium text-foreground">Broadcast a banner</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Puts one line at the top of {tenantName}&rsquo;s public site — the fastest way to
                reach people already on their way to the venue.
              </p>
            </div>

            {activeBanner && (
              <div className="flex items-start gap-2 rounded-lg border border-info/40 bg-info/10 p-2.5 text-sm">
                <span className="flex-1 text-foreground">{activeBanner}</span>
                <button
                  onClick={() => {
                    store.clearBanner(tenantId, tenantName);
                    toast.success("Banner removed");
                  }}
                  className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
                >
                  Remove
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-end gap-2">
              <Field label="Message" className="flex-1 min-w-64">
                <Input
                  value={banner}
                  onChange={(e) => setBanner(e.target.value)}
                  placeholder="Entry delayed by 30 minutes — gates now open at 8:30pm"
                />
              </Field>
              <Button
                size="sm"
                disabled={banner.trim().length < 10}
                onClick={() => {
                  store.setBanner(tenantId, tenantName, banner.trim());
                  toast.success("Banner is live on the public site");
                  setBanner("");
                }}
              >
                Publish banner
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Audit trail ──────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <History className="h-4 w-4 text-muted-foreground" />
          Emergency audit trail
        </h2>
        {store.actions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nothing has ever been triggered here. Long may that continue.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {store.actions.map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                <div className="mt-0.5">
                  {a.active ? (
                    <span className="block h-2 w-2 rounded-full bg-destructive" aria-label="Still in force" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" aria-label="Lifted" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {KIND_LABEL[a.kind]}
                    <span className="font-normal text-muted-foreground"> · {a.scope}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{a.reason}</p>
                  <p className="mt-0.5 text-xs text-placeholder">
                    {a.actor} ·{" "}
                    {new Date(a.at).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {a.active && <Badge variant="destructive">In force</Badge>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Confirmations ────────────────────────────────────────────── */}
      <DangerConfirm
        open={dialog === "pause_sales"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Pause ticket sales on every event?"
        description="Checkout stops immediately across the whole platform. Every organizer's site shows a 'sales paused' notice until you resume."
        confirmPhrase="PAUSE SALES"
        confirmLabel="Pause all sales"
        reasonPlaceholder="Razorpay outage — double charges reported"
        onConfirm={(reason) => {
          store.setGlobalSalesPause(true, reason);
          toast.success("Ticket sales paused platform-wide");
        }}
      />

      <DangerConfirm
        open={dialog === "freeze"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Freeze ${tenantName}?`}
        description="Their dashboard is suspended and their public site goes offline. Passes already issued still scan at the gate."
        confirmPhrase="FREEZE"
        confirmLabel="Freeze tenant"
        reasonPlaceholder="Payment dispute — instructed by finance"
        onConfirm={(reason) => {
          store.freezeTenant(tenantId, tenantName, reason);
          toast.success(`${tenantName} frozen`);
        }}
      />

      <DangerConfirm
        open={dialog === "revoke_scanners"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Revoke every scanner login for this event?"
        description="All gate devices sign out at their next sync. Gates will not be able to validate passes until the organizer re-issues access person by person."
        confirmPhrase="REVOKE ALL"
        confirmLabel="Revoke all scanners"
        reasonPlaceholder="Staff phone stolen at Gate 3"
        onConfirm={(reason) => {
          store.revokeAllScanners(tenantId, tenantName, reason);
          toast.success("All scanner logins revoked");
        }}
      />

      <DangerConfirm
        open={dialog === "offline_allow"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Turn on offline-allow at the gates?"
        description="Gates will admit any pass with a valid signature without checking it against the server. This keeps the queue moving during a network outage and allows a duplicated pass through until the next sync."
        confirmPhrase="OFFLINE ALLOW"
        confirmLabel="Turn on offline-allow"
        reasonPlaceholder="Venue uplink down, queue backing up at all four gates"
        onConfirm={(reason) => {
          store.setOfflineAllow(manharEvent.id, manharEvent.title, true, reason);
          toast.success("Offline-allow mode is on");
        }}
      />
    </div>
  );
}

function Card({
  icon,
  title,
  status,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  status: React.ReactNode;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-raised text-muted-foreground [&_svg]:h-5 [&_svg]:w-5">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-medium text-foreground">{title}</h2>
            {status}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </div>
        <div className="shrink-0">{action}</div>
      </div>
    </div>
  );
}
