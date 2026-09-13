"use client";

import { useState } from "react";
import { QrCode, Ban, RefreshCw, MessageCircle, ShieldCheck, ShieldOff } from "lucide-react";
import { Button, CopyableCode, ConfirmDialog, toast } from "@manhar-garba/ui";
import { useDashboardStore, type TeamMember } from "@/lib/dashboard-store";

const SCANNER_URL = process.env.NEXT_PUBLIC_SCANNER_URL ?? "http://localhost:3002";

/**
 * The organizer's half of gate-scanner access: issue a code to one team member,
 * send it to them, revoke it, or replace it.
 *
 * Everything here keys off the member's mobile number, because that is what
 * they will type at the gate — the code alone is useless on a phone number that
 * isn't on this list.
 */
export function GateAccessPanel({ member }: { member: TeamMember }) {
  const {
    scannerCredentials,
    issueScannerCredential,
    revokeScannerCredential,
    regenerateScannerCredential,
    scannerCodeFor,
  } = useDashboardStore();

  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const credential = scannerCredentials.find((c) => c.teamMemberId === member.id && !c.revokedAt);
  const revoked = scannerCredentials.find((c) => c.teamMemberId === member.id && c.revokedAt);

  if (!credential) {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {revoked && (
          <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
            <ShieldOff className="h-3 w-3" />
            Access revoked
          </span>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            issueScannerCredential(member.id);
            toast.success(`Scanner access issued to ${member.name}`, {
              description: "Send them the code — they sign in with their mobile number and this code.",
            });
          }}
        >
          <QrCode className="mr-1.5 h-3.5 w-3.5" />
          {revoked ? "Re-issue scanner access" : "Issue scanner access"}
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

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-border bg-surface-sunken p-3">
      <div className="flex items-center gap-1.5 text-xs text-success">
        <ShieldCheck className="h-3.5 w-3.5" />
        Scanner access active
        {credential.gateLabel && (
          <span className="text-muted-foreground">· {credential.gateLabel}</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <CopyableCode value={code} label="Login code" className="w-auto" />
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-surface-raised"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Send on WhatsApp
        </a>
      </div>

      <p className="text-xs text-muted-foreground">
        They sign in at <span className="font-mono text-foreground">{SCANNER_URL}</span> with{" "}
        <span className="font-mono text-foreground">{member.phone}</span> and this code.
      </p>

      <div className="flex flex-wrap gap-3 pt-1">
        <button
          onClick={() => {
            regenerateScannerCredential(credential.id);
            toast.success("New code generated", {
              description: "The previous code stops working immediately. Send them the new one.",
            });
          }}
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Generate new code
        </button>
        <button
          onClick={() => setConfirmRevoke(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
        >
          <Ban className="h-3.5 w-3.5" />
          Revoke access
        </button>
      </div>

      <ConfirmDialog
        open={confirmRevoke}
        onOpenChange={setConfirmRevoke}
        title={`Revoke scanner access for ${member.name}?`}
        description="They will be signed out of the scanner on their next sync and will not be able to validate any more passes. You can re-issue access at any time."
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
