"use client";

import { useState } from "react";
import { useDashboardStore, type Role } from "@/lib/dashboard-store";
import { RoleGate } from "@/components/dashboard/role-gate";
import { Button, Input, Field, toast } from "@manhar-garba/ui";
import { GateAccessPanel } from "@/components/dashboard/gate-access-panel";
import { gates as allGates } from "@manhar-garba/mock-data";
import { isValidIndianPhone, normalizePhone } from "@manhar-garba/domain";
import { Plus, Trash2, Shield } from "lucide-react";

const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  finance: "Finance",
  gate_staff: "Gate Staff",
  vendor: "Vendor",
};

export default function TeamPage() {
  const {
    team,
    addTeamMember,
    removeTeamMember,
    currentRole,
    setCurrentRole,
  } = useDashboardStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("finance");
  const [gateId, setGateId] = useState<string>(allGates[0]?.id ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  function handleAdd() {
    if (!name.trim()) {
      setFormError("Enter the person's name.");
      return;
    }
    // Gate staff sign in by phone number, so an unusable number here means a
    // guard who cannot get into the scanner on the night — reject it now
    // rather than at the gate.
    if (!isValidIndianPhone(phone)) {
      setFormError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    const normalized = normalizePhone(phone);
    if (team.some((m) => m.phone === normalized)) {
      setFormError("Someone on the team already uses this number.");
      return;
    }

    const gateLabel =
      role === "gate_staff" ? allGates.find((g) => g.id === gateId)?.name : undefined;
    addTeamMember(gateLabel ? { name, phone: normalized, role, gateLabel } : { name, phone: normalized, role });
    toast.success(`${name} added as ${ROLE_LABELS[role]}`, {
      description:
        role === "gate_staff"
          ? "Now issue them scanner access to let them validate passes."
          : undefined,
    });
    setName("");
    setPhone("");
    setFormError(null);
    setShowForm(false);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Team</h1>
        <RoleGate allow={["owner"]}>
          <Button size="sm" onClick={() => setShowForm((s) => !s)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Invite member
          </Button>
        </RoleGate>
      </div>

      {/* Role switcher for demo */}
      <div className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
        <span>Demo: viewing as </span>
        <select
          className="mx-1 bg-transparent text-foreground font-medium focus:outline-none"
          value={currentRole}
          onChange={(e) => setCurrentRole(e.target.value as Role)}
        >
          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
        <span>— add/remove buttons visible to owner only.</span>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full name"><Input value={name} onChange={(e) => { setName(e.target.value); setFormError(null); }} placeholder="Kaushik Shah" /></Field>
            <Field label="Mobile number"><Input value={phone} onChange={(e) => { setPhone(e.target.value); setFormError(null); }} placeholder="98765 43210" inputMode="tel" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Role">
              <select
                className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground"
                value={role} onChange={(e) => { setRole(e.target.value as Role); setFormError(null); }}
              >
                {(Object.entries(ROLE_LABELS) as [Role, string][]).filter(([r]) => r !== "owner").map(([r, l]) => (
                  <option key={r} value={r}>{l}</option>
                ))}
              </select>
            </Field>
            {role === "gate_staff" && (
              <Field label="Posted at">
                <select
                  className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground"
                  value={gateId} onChange={(e) => setGateId(e.target.value)}
                >
                  {allGates.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          {role === "gate_staff" && (
            <p className="rounded-lg border border-info/30 bg-info/10 p-2.5 text-xs text-muted-foreground">
              Gate staff can only open the scanner from this mobile number, and only with a code
              you issue below after adding them. Nobody can sign themselves up.
            </p>
          )}

          {formError && (
            <p role="alert" className="text-xs text-destructive">{formError}</p>
          )}

          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>Add member</Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setFormError(null); }}>Cancel</Button>
          </div>
        </div>
      )}

      <ul className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
        {team.map((m) => {
          return (
            <li key={m.id} className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary shrink-0">
                  {m.name.slice(0, 1)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                    <Shield className="h-3 w-3" />
                    {ROLE_LABELS[m.role]}
                  </span>
                  <RoleGate allow={["owner"]}>
                    <button
                      onClick={() => removeTeamMember(m.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </RoleGate>
                </div>
              </div>

              {/* Gate-scanner access — issued only from here, never self-registered
                  (docs/02-product/user-flows.md, Surface 3). */}
              {m.role === "gate_staff" && (
                <RoleGate allow={["owner"]}>
                  <div className="ml-12">
                    <GateAccessPanel member={m} />
                  </div>
                </RoleGate>
              )}

            </li>
          );
        })}
      </ul>
    </div>
  );
}
