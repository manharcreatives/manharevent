"use client";

import { useState } from "react";
import { CheckCircle, Lock, Landmark, Pencil, Save, ShieldAlert } from "lucide-react";
import { Button, Input, Field, toast } from "@manhar-garba/ui";
import { useDashboardStore, maskedAccountNumber } from "@/lib/dashboard-store";

/** IFSC is four letters, a zero, then six alphanumerics — RBI's fixed format. */
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export default function PaymentsPage() {
  const bankAccount = useDashboardStore((s) => s.bankAccount);
  const updateBankAccount = useDashboardStore((s) => s.updateBankAccount);

  const [editing, setEditing] = useState(false);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Payments &amp; banking</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Where your ticket money lands. Payouts go to this account only.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Razorpay account</h2>
          <span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs text-success">
            <CheckCircle className="h-3.5 w-3.5" />
            Verified
          </span>
        </div>
        <Field label="Razorpay Key ID (read-only)">
          <div className="flex items-center gap-2">
            <Input value="rzp_live_••••••••••••••••" readOnly className="flex-1 font-mono" />
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
        </Field>
        <p className="text-xs text-muted-foreground">
          Key rotation is handled by Manhar Creatives — contact support if you suspect it has leaked.
        </p>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Payout bank account</h2>
          </div>
          {!editing && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Change
            </Button>
          )}
        </div>

        {editing ? (
          <BankAccountForm
            initial={bankAccount}
            onCancel={() => setEditing(false)}
            onSave={(next) => {
              updateBankAccount(next);
              setEditing(false);
              toast.success("Payout account updated", {
                description: `Future payouts go to ${maskedAccountNumber(next.accountNumber)}.`,
              });
            }}
          />
        ) : (
          <>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Account holder</dt>
                <dd className="mt-0.5 text-sm text-foreground">{bankAccount.accountHolder}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">IFSC</dt>
                <dd className="mt-0.5 font-mono text-sm text-foreground">{bankAccount.ifsc}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Account number</dt>
                <dd className="mt-0.5 font-mono text-sm text-foreground">
                  {maskedAccountNumber(bankAccount.accountNumber)}
                </dd>
              </div>
            </dl>
            {bankAccount.updatedAt && (
              <p className="text-xs text-muted-foreground">
                Last changed{" "}
                {new Date(bankAccount.updatedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                .
              </p>
            )}
          </>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground">GST registration</h2>
        <Field label="GSTIN">
          <Input value="24AAACM1234C1Z5" className="font-mono" readOnly />
        </Field>
        <p className="text-xs text-muted-foreground">
          Contact support to update your GSTIN — it appears on every invoice already issued, so it
          cannot be changed from here.
        </p>
      </section>
    </div>
  );
}

function BankAccountForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: { accountHolder: string; accountNumber: string; ifsc: string };
  onSave: (next: { accountHolder: string; accountNumber: string; ifsc: string }) => void;
  onCancel: () => void;
}) {
  const [accountHolder, setAccountHolder] = useState(initial.accountHolder);
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmNumber, setConfirmNumber] = useState("");
  const [ifsc, setIfsc] = useState(initial.ifsc);
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!accountHolder.trim()) {
      setError("Enter the account holder's name exactly as the bank has it.");
      return;
    }
    const digits = accountNumber.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 18) {
      setError("An Indian account number is 9 to 18 digits.");
      return;
    }
    // Typed twice on purpose: a wrong digit here sends the season's takings to
    // a stranger, and nothing in the payout flow can catch it afterwards.
    if (digits !== confirmNumber.replace(/\D/g, "")) {
      setError("The two account numbers don't match.");
      return;
    }
    const upperIfsc = ifsc.trim().toUpperCase();
    if (!IFSC_PATTERN.test(upperIfsc)) {
      setError("That IFSC doesn't look right — it should read like HDFC0001234.");
      return;
    }
    onSave({ accountHolder: accountHolder.trim(), accountNumber: digits, ifsc: upperIfsc });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <p className="text-xs text-foreground">
          Every payout after this change goes to the new account. Double-check the number against
          your passbook — a wrong digit cannot be reversed once a payout is sent.
        </p>
      </div>

      <Field label="Account holder">
        <Input
          value={accountHolder}
          onChange={(e) => {
            setAccountHolder(e.target.value);
            setError(null);
          }}
          placeholder="Manhar Creatives Pvt Ltd"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Account number">
          <Input
            value={accountNumber}
            onChange={(e) => {
              setAccountNumber(e.target.value.replace(/[^\d]/g, ""));
              setError(null);
            }}
            placeholder="50100234567890"
            inputMode="numeric"
            autoComplete="off"
            className="font-mono"
          />
        </Field>
        <Field label="Re-enter account number">
          <Input
            value={confirmNumber}
            onChange={(e) => {
              setConfirmNumber(e.target.value.replace(/[^\d]/g, ""));
              setError(null);
            }}
            placeholder="50100234567890"
            inputMode="numeric"
            autoComplete="off"
            onPaste={(e) => e.preventDefault()}
            className="font-mono"
          />
        </Field>
      </div>

      <Field label="IFSC code">
        <Input
          value={ifsc}
          onChange={(e) => {
            setIfsc(e.target.value.toUpperCase());
            setError(null);
          }}
          placeholder="HDFC0001234"
          className="font-mono uppercase"
        />
      </Field>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={save}>
          <Save className="mr-1.5 h-4 w-4" />
          Update bank details
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
