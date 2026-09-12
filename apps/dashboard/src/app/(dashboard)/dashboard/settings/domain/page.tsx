"use client";

import { Button, Input, Field } from "@manhar-garba/ui";
import { useState } from "react";
import { CheckCircle } from "lucide-react";

export default function DomainPage() {
  const [domain, setDomain] = useState("manharnavratri.in");
  const [subdomain, setSubdomain] = useState("manharevents");
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "verifying" | "ok">("ok");

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Domain</h1>

      <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Manharevents subdomain</h2>
        <Field label="Subdomain">
          <div className="flex items-center gap-0 overflow-hidden rounded-md border border-border">
            <input
              className="flex-1 bg-surface-raised px-3 py-2 text-sm text-foreground focus:outline-none"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            />
            <span className="bg-surface px-3 py-2 text-sm text-muted-foreground whitespace-nowrap">.manharevents.in</span>
          </div>
        </Field>
        <p className="text-xs text-muted-foreground">Your public site: <a href={`https://${subdomain}.manharevents.in`} className="text-primary hover:underline">{subdomain}.manharevents.in</a></p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Custom domain</h2>
        <Field label="Your domain">
          <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="yourgarba.com" />
        </Field>
        <div className="rounded-lg bg-surface-raised p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">DNS configuration required</p>
          <p>Add a CNAME record pointing to: <span className="font-mono text-foreground">cname.manharevents.in</span></p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={() => setVerifyStatus("verifying")}>
            {verifyStatus === "verifying" ? "Checking…" : "Verify DNS"}
          </Button>
          {verifyStatus === "ok" && (
            <span className="flex items-center gap-1 text-xs text-success">
              <CheckCircle className="h-3.5 w-3.5" />
              Domain verified
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
