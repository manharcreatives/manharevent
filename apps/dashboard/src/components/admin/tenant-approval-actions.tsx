"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TenantApplication } from "@manhar-garba/domain";
import { Button, Field, Textarea } from "@manhar-garba/ui";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { approveApplicationAction, rejectApplicationAction } from "@/app/actions/tenant-applications";

interface Props {
  application: TenantApplication;
}

type Mode = "idle" | "reject" | "more_info";

// The only human-decision step in F0 (docs/02-product/user-flows.md) —
// everything after approval is meant to be automated provisioning, not a
// second manual step. This mock stage doesn't have a real provisioning
// pipeline to kick off, so approveApplication() just flips status +
// provisionedAt at once (see its own doc comment in packages/mock-data).
export function TenantApprovalActions({ application }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("idle");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const isDecidable = application.status === "submitted" || application.status === "under_review";
  const isReconsiderable = application.status === "more_info_needed";

  function handleApprove() {
    startTransition(async () => {
      await approveApplicationAction(application.id);
      router.refresh();
    });
  }

  function handleReject(moreInfoNeeded: boolean) {
    if (!reason.trim()) return;
    startTransition(async () => {
      await rejectApplicationAction(application.id, reason.trim(), moreInfoNeeded);
      setMode("idle");
      setReason("");
      router.refresh();
    });
  }

  if (!isDecidable && !isReconsiderable) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
        {application.status === "approved" ? (
          <span className="flex items-center gap-2 text-success">
            <CheckCircle2 className="h-4 w-4" /> Approved and provisioned
            {application.decidedAt && ` on ${new Date(application.decidedAt).toLocaleDateString("en-IN")}`}.
          </span>
        ) : (
          <span className="flex items-center gap-2 text-destructive">
            <XCircle className="h-4 w-4" /> Rejected
            {application.rejectionReason && ` — "${application.rejectionReason}"`}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      {isReconsiderable && application.rejectionReason && (
        <p className="mb-3 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          Previously sent back: &ldquo;{application.rejectionReason}&rdquo;
        </p>
      )}

      {mode === "idle" && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleApprove} disabled={isPending}>
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            Approve &amp; provision
          </Button>
          <Button variant="outline" onClick={() => setMode("more_info")} disabled={isPending}>
            Ask for more info
          </Button>
          <Button variant="destructive" onClick={() => setMode("reject")} disabled={isPending}>
            Reject
          </Button>
        </div>
      )}

      {(mode === "reject" || mode === "more_info") && (
        <div className="space-y-3">
          <Field label={mode === "reject" ? "Reason for rejection (shown to the organizer)" : "What's missing? (shown to the organizer)"}>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={mode === "reject" ? "e.g. Desired subdomain already in use" : "e.g. Please confirm your venue capacity"}
            />
          </Field>
          <div className="flex gap-2">
            <Button
              variant={mode === "reject" ? "destructive" : "primary"}
              onClick={() => handleReject(mode === "more_info")}
              disabled={isPending || !reason.trim()}
            >
              {mode === "reject" ? "Confirm rejection" : "Send back for more info"}
            </Button>
            <Button variant="ghost" onClick={() => { setMode("idle"); setReason(""); }} disabled={isPending}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
