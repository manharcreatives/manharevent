"use client";

import { useState } from "react";
import { useDashboardStore, type Role } from "@/lib/dashboard-store";
import { RoleGate } from "@/components/dashboard/role-gate";
import { Button, Input, Field, CopyableCode } from "@manhar-garba/ui";
import { Plus, Trash2, Shield, QrCode, Ban } from "lucide-react";

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
    scannerCredentials,
    issueScannerCredential,
    revokeScannerCredential,
  } = useDashboardStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("finance");

  function handleAdd() {
    if (!name.trim() || !phone.trim()) return;
    addTeamMember({ name, phone, role });
    setName(""); setPhone(""); setShowForm(false);
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
            <Field label="Full name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kaushik Shah" /></Field>
            <Field label="Mobile number"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" /></Field>
          </div>
          <Field label="Role">
            <select
              className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground"
              value={role} onChange={(e) => setRole(e.target.value as Role)}
            >
              {(Object.entries(ROLE_LABELS) as [Role, string][]).filter(([r]) => r !== "owner").map(([r, l]) => (
                <option key={r} value={r}>{l}</option>
              ))}
            </select>
          </Field>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>Invite</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <ul className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
        {team.map((m) => {
          const credential = scannerCredentials.find((c) => c.teamMemberId === m.id && !c.revokedAt);
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
                  (docs/02-product/user-flows.md's Surface-3 note, FE-10). */}
              {m.role === "gate_staff" && (
                <RoleGate allow={["owner"]}>
                  <div className="ml-12 mt-2">
                    {credential ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <CopyableCode value={credential.code} label="Scanner login code" className="w-auto" />
                        <button
                          onClick={() => revokeScannerCredential(credential.id)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Revoke
                        </button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => issueScannerCredential(m.id)}>
                        <QrCode className="mr-1.5 h-3.5 w-3.5" />
                        Issue scanner login
                      </Button>
                    )}
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
