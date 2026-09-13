"use client";

import Link from "next/link";
import { Users, ShieldCheck, ShieldOff, DoorOpen, AlertTriangle, ArrowRight } from "lucide-react";
import { Button, EmptyState, StatTile } from "@manhar-garba/ui";
import { gates as allGates } from "@manhar-garba/mock-data";
import { useDashboardStore, type TeamMember } from "@/lib/dashboard-store";
import { GateAccessPanel } from "@/components/dashboard/gate-access-panel";
import { RoleGate } from "@/components/dashboard/role-gate";

/**
 * Gate coverage, organised by gate rather than by person — the question an
 * organizer actually asks the night before is "is every gate staffed and can
 * they all get into the scanner", not "who is on the team".
 *
 * It reads the same roster and credentials that `apps/scanner` authenticates
 * against (`packages/mock-data/src/fixtures/gate-staff.ts` → the derived code
 * in `packages/domain/src/logic/gate-access.ts`), so what it shows is what will
 * happen at the gate.
 *
 * Division of labour with `/dashboard/team`: a guard is added and handed their
 * code there; here you see whether the code works and take it away. Both pages
 * used to carry the identical panel, so the same person had two Revoke buttons
 * on two screens.
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
          <nav className="mb-1 text-xs text-muted-foreground">
            <Link href="/dashboard/team" className="hover:text-foreground">Team</Link>
            {" / "}
            <span className="text-foreground">Gate coverage</span>
          </nav>
          <h1 className="font-display text-2xl font-bold text-foreground">Gate coverage</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Who is on each gate tonight, and whether their scanner code still works.
          </p>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link href="/dashboard/team">
            <Users className="mr-1.5 h-4 w-4" />
            Add or issue access
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Gates" value={allGates.length} sub={`${allGates.length - uncoveredGates.length} staffed`} />
        <StatTile label="Gate staff" value={gateStaff.length} sub="On the roster" />
        <StatTile
          label="Can scan"
          value={withAccess.length}
          sub={withAccess.length === gateStaff.length ? "Everyone" : `${gateStaff.length - withAccess.length} without a code`}
          trend={withAccess.length === gateStaff.length ? "up" : "down"}
          className={withAccess.length === gateStaff.length ? undefined : "border-warning/40"}
        />
        <StatTile
          label="Uncovered"
          value={uncoveredGates.length}
          sub={uncoveredGates.length === 0 ? "Every gate staffed" : "Assign someone"}
          className={uncoveredGates.length === 0 ? undefined : "border-destructive/40"}
        />
      </div>

      {uncoveredGates.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-foreground">
            <span className="font-semibold">
              {uncoveredGates.length} gate{uncoveredGates.length === 1 ? "" : "s"} with nobody posted
            </span>{" "}
            — {uncoveredGates.map((g) => g.gate.name).join(", ")}. Assign someone before doors open.{" "}
            <Link href="/dashboard/team" className="font-medium text-primary hover:underline">
              Post a guard to a gate
            </Link>
            .
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
                <div className="px-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    Nobody is posted here. Passes for this gate&rsquo;s zone cannot be validated until someone is.
                  </p>
                  <Link
                    href="/dashboard/team"
                    className="mt-1.5 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Post someone to {gate.name}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
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
        <div className="sm:ml-12">
          <GateAccessPanel member={member} variant="manage" />
        </div>
      </RoleGate>
    </li>
  );
}
