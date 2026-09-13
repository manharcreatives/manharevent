"use client";

import Link from "next/link";
import { Users, ShieldCheck, ShieldOff, DoorOpen, AlertTriangle } from "lucide-react";
import { Button, EmptyState } from "@manhar-garba/ui";
import { gates as allGates } from "@manhar-garba/mock-data";
import { useDashboardStore, type TeamMember } from "@/lib/dashboard-store";
import { GateAccessPanel } from "@/components/dashboard/gate-access-panel";
import { RoleGate } from "@/components/dashboard/role-gate";

/**
 * Gate coverage, organised by gate rather than by person — the question an
 * organizer actually asks the night before is "is every gate staffed and can
 * they all get into the scanner", not "who is on the team".
 *
 * This used to be a hardcoded list of fake devices with two buttons that did
 * nothing. It now reads the same roster and credentials that `apps/scanner`
 * authenticates against, so what it shows is what will happen at the gate.
 */
export default function GateStaffPage() {
  const { team, scannerCredentials } = useDashboardStore();

  const gateStaff = team.filter((m) => m.role === "gate_staff");
  const withAccess = gateStaff.filter((m) =>
    scannerCredentials.some((c) => c.teamMemberId === m.id && !c.revokedAt)
  );

  const byGate = allGates.map((gate) => ({
    gate,
    staff: gateStaff.filter((m) => m.gateLabel === gate.name),
  }));
  const unassigned = gateStaff.filter((m) => !allGates.some((g) => g.name === m.gateLabel));
  const uncoveredGates = byGate.filter((g) => g.staff.length === 0);

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Gate staff</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {withAccess.length} of {gateStaff.length} can currently open the scanner.
          </p>
        </div>
        <Link href="/dashboard/team">
          <Button size="sm" variant="outline">
            <Users className="mr-1.5 h-4 w-4" />
            Add gate staff
          </Button>
        </Link>
      </div>

      {uncoveredGates.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-foreground">
            <span className="font-semibold">
              {uncoveredGates.length} gate{uncoveredGates.length === 1 ? "" : "s"} with nobody posted
            </span>{" "}
            — {uncoveredGates.map((g) => g.gate.code).join(", ")}. Assign someone before doors open.
          </p>
        </div>
      )}

      {gateStaff.length === 0 ? (
        <EmptyState
          icon={<DoorOpen />}
          title="No gate staff yet"
          description="Add your security team with their mobile numbers, then issue each of them a scanner code."
          action={
            <Link href="/dashboard/team">
              <Button size="sm">Add your first gate staff</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {byGate.map(({ gate, staff }) => (
            <section key={gate.id} className="rounded-xl border border-border bg-surface">
              <header className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <DoorOpen className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">{gate.name}</h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  {staff.length === 0
                    ? "Nobody posted"
                    : `${staff.length} ${staff.length === 1 ? "person" : "people"}`}
                </span>
              </header>

              {staff.length === 0 ? (
                <p className="px-4 py-4 text-sm text-muted-foreground">
                  No one is posted here yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {staff.map((m) => (
                    <StaffRow key={m.id} member={m} />
                  ))}
                </ul>
              )}
            </section>
          ))}

          {unassigned.length > 0 && (
            <section className="rounded-xl border border-dashed border-border bg-surface">
              <header className="border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold text-foreground">Not posted to a gate</h2>
                <p className="text-xs text-muted-foreground">
                  They can still scan — the scanner just won&rsquo;t default to a gate for them.
                </p>
              </header>
              <ul className="divide-y divide-border">
                {unassigned.map((m) => (
                  <StaffRow key={m.id} member={m} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function StaffRow({ member }: { member: TeamMember }) {
  const scannerCredentials = useDashboardStore((s) => s.scannerCredentials);
  const active = scannerCredentials.some((c) => c.teamMemberId === member.id && !c.revokedAt);

  return (
    <li className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
          {member.name.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{member.name}</p>
          <p className="font-mono text-xs text-muted-foreground">{member.phone}</p>
        </div>
        {active ? (
          <span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs text-success">
            <ShieldCheck className="h-3 w-3" />
            Can scan
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
            <ShieldOff className="h-3 w-3" />
            No access
          </span>
        )}
      </div>
      <RoleGate allow={["owner"]}>
        <div className="ml-12">
          <GateAccessPanel member={member} />
        </div>
      </RoleGate>
    </li>
  );
}
