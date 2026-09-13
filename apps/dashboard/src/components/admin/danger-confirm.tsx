"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Field,
  Textarea,
} from "@manhar-garba/ui";

/**
 * Confirmation for an action that reaches real attendees mid-event.
 *
 * Two deliberate bits of friction that a plain "Are you sure?" doesn't give:
 * the operator has to **type the exact phrase**, which rules out a mis-click
 * and a muscle-memory Enter, and they have to **write down why**, which goes
 * into the audit trail. On night four of Navratri the "why" is the only thing
 * that makes the next morning's post-mortem possible.
 */
export function DangerConfirm({
  open,
  onOpenChange,
  title,
  description,
  confirmPhrase,
  confirmLabel,
  reasonPlaceholder,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmPhrase: string;
  confirmLabel: string;
  reasonPlaceholder?: string;
  onConfirm: (reason: string) => void;
}) {
  const [typed, setTyped] = useState("");
  const [reason, setReason] = useState("");

  const phraseOk = typed.trim().toUpperCase() === confirmPhrase.toUpperCase();
  const reasonOk = reason.trim().length >= 5;

  function close() {
    setTyped("");
    setReason("");
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
        else onOpenChange(true);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label={`Type ${confirmPhrase} to confirm`}>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={confirmPhrase}
              autoComplete="off"
              className="font-mono uppercase"
            />
          </Field>

          <Field label="Reason (goes into the audit trail)">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder ?? "What is happening, and who asked for this?"}
              rows={2}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!phraseOk || !reasonOk}
            onClick={() => {
              onConfirm(reason.trim());
              close();
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
