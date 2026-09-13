"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock, Globe, Save, AlertCircle } from "lucide-react";
import { Button, Input, Field, CopyableCode, toast } from "@manhar-garba/ui";
import { useDashboardStore } from "@/lib/dashboard-store";
import { useHydrated } from "@/lib/use-hydrated";

const ROOT_DOMAIN = "manharevent.com";
const CNAME_TARGET = "sites.manharevent.com";

export default function DomainPage() {
  const hydrated = useHydrated();
  const settings = useDashboardStore((s) => s.domainSettings);
  const { updateDomainSettings, startDomainVerification, confirmDomainVerification } = useDashboardStore();

  const [subdomain, setSubdomain] = useState(settings.subdomain);
  const [customDomain, setCustomDomain] = useState(settings.customDomain);
  useEffect(() => {
    setSubdomain(settings.subdomain);
    setCustomDomain(settings.customDomain);
  }, [settings.subdomain, settings.customDomain]);

  if (!hydrated) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  const dirty = subdomain !== settings.subdomain || customDomain.trim() !== settings.customDomain;
  const validCustom = !customDomain.trim() || /^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(customDomain.trim());

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Domain</h1>
        <p className="mt-1 text-sm text-muted-foreground">Where buyers find your booking site.</p>
      </div>

      <section className="space-y-4 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground">ManharEvent address</h2>
        <Field label="Subdomain">
          <div className="flex items-center overflow-hidden rounded-md border border-border">
            <input
              className="flex-1 bg-surface-raised px-3 py-2 text-sm text-foreground focus:outline-none"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40))}
            />
            <span className="whitespace-nowrap bg-surface px-3 py-2 text-sm text-muted-foreground">.{ROOT_DOMAIN}</span>
          </div>
        </Field>
        <p className="text-xs text-muted-foreground">
          Always works, no setup: <span className="font-mono text-foreground">{subdomain || "…"}.{ROOT_DOMAIN}</span>
        </p>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Custom domain</h2>
          {settings.status === "verified" && (
            <span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs text-success">
              <CheckCircle className="h-3.5 w-3.5" /> Verified
            </span>
          )}
          {settings.status === "pending_dns" && (
            <span className="flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs text-warning">
              <Clock className="h-3.5 w-3.5" /> Waiting for DNS
            </span>
          )}
        </div>
        <Field label="Your domain (optional)" error={validCustom ? undefined : "That doesn't look like a domain — e.g. yourgarba.in"}>
          <Input value={customDomain} onChange={(e) => setCustomDomain(e.target.value.trim().toLowerCase())} placeholder="yourgarba.in" />
        </Field>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled={!dirty || !validCustom || !subdomain}
            onClick={() => {
              updateDomainSettings({ subdomain, customDomain: customDomain.trim() });
              toast.success("Domain settings saved", {
                description: customDomain.trim() && customDomain.trim() !== settings.customDomain ? "Now add the DNS record below." : undefined,
              });
            }}
          >
            <Save className="mr-1.5 h-4 w-4" />
            Save
          </Button>
          {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
        </div>

        {settings.customDomain && settings.status !== "verified" && (
          <div className="space-y-3 rounded-lg border border-border bg-surface-raised p-3">
            <p className="text-sm font-medium text-foreground">Add this record at your domain provider</p>
            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <span>Type</span><span>Name</span><span>Points to</span>
              <span className="font-mono text-foreground">CNAME</span>
              <span className="font-mono text-foreground">{settings.customDomain.split(".").length > 2 ? settings.customDomain.split(".")[0] : "www"}</span>
              <span className="font-mono text-foreground">{CNAME_TARGET}</span>
            </div>
            <CopyableCode value={CNAME_TARGET} label="Target" />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  startDomainVerification();
                  toast("Checking DNS…", { description: "Changes at your provider can take from 10 minutes to 24 hours." });
                }}
              >
                <Globe className="mr-1.5 h-4 w-4" />
                Check DNS
              </Button>
              {settings.checkedAt && (
                <span className="text-xs text-muted-foreground">
                  Last checked {new Date(settings.checkedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} — record not found yet
                </span>
              )}
            </div>
            {settings.status === "pending_dns" && settings.checkedAt && (
              <div className="flex items-start gap-2 rounded-md border border-dashed border-border p-2.5 text-xs text-muted-foreground">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="flex-1">
                  Demo: there is no DNS lookup in this build. Use this to show the verified state.
                </span>
                <button
                  onClick={() => {
                    confirmDomainVerification();
                    toast.success(`${settings.customDomain} verified`);
                  }}
                  className="shrink-0 font-medium text-primary hover:underline"
                >
                  Simulate DNS found
                </button>
              </div>
            )}
          </div>
        )}

        {settings.status === "verified" && settings.customDomain && (
          <p className="text-xs text-muted-foreground">
            Buyers can use <span className="font-mono text-foreground">{settings.customDomain}</span>. HTTPS certificate issued
            automatically.
          </p>
        )}
      </section>
    </div>
  );
}
