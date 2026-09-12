"use client";

import { Button, Input, Field } from "@manhar-garba/ui";
import { CheckCircle, Lock } from "lucide-react";

export default function PaymentsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Payments & Banking</h1>

      <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
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
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Bank account</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Account holder"><Input placeholder="Manhar Creatives Pvt Ltd" /></Field>
          <Field label="IFSC code"><Input placeholder="HDFC0001234" className="font-mono" /></Field>
        </div>
        <Field label="Account number"><Input type="password" placeholder="••••••••••••" className="font-mono" /></Field>
        <Button size="sm">Update bank details</Button>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">GST registration</h2>
        <Field label="GSTIN">
          <Input value="24AAACM1234C1Z5" className="font-mono" readOnly />
        </Field>
        <p className="text-xs text-muted-foreground">Contact support to update GSTIN — required for GST invoices.</p>
      </div>
    </div>
  );
}
