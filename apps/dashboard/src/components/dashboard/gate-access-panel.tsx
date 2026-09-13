"use client";

import Link from "next/link";
import { useState } from "react";
import { QrCode, Ban, RefreshCw, MessageCircle, ShieldCheck, ShieldOff, ArrowRight } from "lucide-react";
import { Button, CopyableCode, ConfirmDialog, toast } from "@manhar-garba/ui";
import { useDashboardStore, type TeamMember } from "@/lib/dashboard-store";

const SCANNER_URL = process.env.NEXT_PUBLIC_SCANNER_URL ?? "http://localhost:3002";

/**
 * The organizer's half of gate-scanner access.
 *
 * Everything here keys off the member's mobile number, because that is what
 * they will type at the gate — the code alone is useless on a phone number that
 * isn't on this list.
 *
 * The two surfaces are deliberately not the same control. **Team** is where a
 * guard is added and handed a code (`variant="issue"`); **Gate coverage** is
 * where the night-before question "can everyone at Gate 3 actually scan?" gets
 * answered, and where access is taken away (`variant="manage"`). Rendering the
 * full panel in both places, as this used to, gave the organizer two Revoke
 * buttons for the same person on two pages and no idea which one was canonical.
 */
export function GateAccessPanel({
  member,
  variant = "issue",
}: {
  member: TeamMember;
  variant?: "issue" | "manage";
}) {
  const {
    scannerCredentials,
    issueScannerCredential,
    revokeScannerCredential,
    regenerateScannerCredential,
    scannerCodeFor,
  } = useDashboardStore();

  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const credential = scannerCredentials.find((c) => c.teamMemberId === member.id && !c.revokedAt);
  const everRevoked = scannerCredentials.some((c) => c.teamMemberId === member.id && c.revokedAt);

  // ── No live credential ───────────────────────────────────────────────
  if (!credential) {
    if (variant === "manage") {
      // Issuing belongs to Team. Point there rather than growing a second
      // issuing control that has to be kept in step with the first.
      return (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">
            <ShieldOff className="h-3 w-3" />
            {everRevoked ? "Access revoked" : "No scanner access"}
          </span>
          <Link
            href="/dashboard/team"
            className="flex items-center gap-1 text-primary hover:underline"
          >
            Issue a code from Team
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      );
    }

    return (
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {everRevoked && (
          <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
            <ShieldOff className="h-3 w-3" />
            Access revoked
          </span>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            issueScannerCredential(member.id, member.gateLabel);
            toast.success(`Scanner access issued to ${member.name}`, {
              description: "Send them the code — they sign in with their mobile number and this code.",
            });
          }}
        >
          <QrCode className="mr-1.5 h-3.5 w-3.5" />
          {everRevoked ? "Re-issue scanner access" : "Issue scanner access"}
        </Button>
      </div>
    );
  }

  const code = scannerCodeFor(credential);
  const whatsappText = encodeURIComponent(
    `Your ManharEvent gate-scanner login\n\n` +
      `Open: ${SCANNER_URL}\n` +
      `Mobile: ${member.phone}\n` +
      `Code: ${code}\n\n` +
      (credential.gateLabel ? `You are posted at ${credential.gateLabel}.\n` : "") +
      `Don't share this code — every scan is logged against your name.`
  );
  const whatsappHref = `https://wa.me/${member.phone.replace(/\D/g, "")}?text=${whatsappText}`;

  // ── Live credential ──────────────────────────────────────────────────
  return (
    <div className="mt-2 space-y-2 rounded-lg border border-border bg-surface-sunken p-3">
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-success">
        <ShieldCheck className="h-3.5 w-3.5" />
        Scanner access active
        {credential.gateLabel && (
          <span className="text-muted-foreground">· {credential.gateLabel}</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <CopyableCode value={code} label="Login code" className="w-auto" />
        {variant === "issue" && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-surface-raised sm:h-9"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Send on WhatsApp
          </a>
        )}
      </div>

      {variant === "issue" && (
        <p className="text-xs text-muted-foreground">
          They sign in at <span className="font-mono text-foreground">{SCANNER_URL}</span> with{" "}
          <span className="font-mono text-foreground">{member.phone}</span> and this code.
        </p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
        <button
          onClick={() => {
            regenerateScannerCredential(credential.id);
            toast.success("New code generated", {
              description: "The previous code stops working immediately. Send them the new one.",
            });
          }}
          className="flex items-center gap-1 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Generate new code
        </button>

        {variant === "manage" ? (
          <button
            onClick={() => setConfirmRevoke(true)}
            className="flex items-center gap-1 py-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive"
          >
            <Ban className="h-3.5 w-3.5" />
            Revoke access
          </button>
        ) : (
          <Link
            href="/dashboard/team/gate-staff"
            className="flex items-center gap-1 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Gate coverage &amp; revoke
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      <ConfirmDialog
        open={confirmRevoke}
        onOpenChange={setConfirmRevoke}
        title={`Revoke scanner access for ${member.name}?`}
        description="They will be signed out of the scanner on their next sync and will not be able to validate any more passes. You can re-issue access from the Team page at any time."
        confirmLabel="Revoke access"
        variant="destructive"
        onConfirm={() => {
          revokeScannerCredential(credential.id);
          setConfirmRevoke(false);
          toast.success(`Scanner access revoked for ${member.name}`);
        }}
      />
    </div>
  );
}
