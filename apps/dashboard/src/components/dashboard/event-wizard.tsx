"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Field } from "@manhar-garba/ui";
import { useDashboardStore } from "@/lib/dashboard-store";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import type { Event } from "@manhar-garba/domain";

const STEPS = ["Basics", "Dates & Nights", "Venue & Zones", "Passes & Pricing", "Review & Publish"];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <ol className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <li key={i} className="flex items-center gap-2">
          <div
            className={[
              "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
              i < current ? "bg-success text-white"
                : i === current ? "bg-primary text-white"
                : "bg-surface-raised text-muted-foreground",
            ].join(" ")}
          >
            {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </div>
          {i < total - 1 && <div className="h-px w-4 bg-border" />}
        </li>
      ))}
    </ol>
  );
}

export function EventWizard({ cloneFrom }: { cloneFrom?: Event }) {
  const router = useRouter();
  const { addAuditEntry } = useDashboardStore();
  const [step, setStep] = useState(0);

  // Form state with working defaults
  const [title, setTitle] = useState(cloneFrom ? `${cloneFrom.title} (Copy)` : "");
  const [subtitle, setSubtitle] = useState(cloneFrom?.subtitle ?? "");
  const [category, setCategory] = useState(cloneFrom?.category ?? "garba");
  const [startDate, setStartDate] = useState(cloneFrom ? "2027-10-01" : "");
  const [nightCount, setNightCount] = useState(9);
  const [venue, setVenue] = useState(cloneFrom ? "Sardar Patel Ground, Ahmedabad" : "");
  const [totalCapacity, setTotalCapacity] = useState(25000);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [reentryPolicy, setReentryPolicy] = useState(cloneFrom?.reentry_policy ?? "unlimited");
  const [gstEnabled, setGstEnabled] = useState(true);
  const [convFeePct, setConvFeePct] = useState(2.5);

  function handleFinish() {
    addAuditEntry("event.created", `New event "${title}" created`);
    router.push("/dashboard/events");
  }

  const canNext = (
    (step === 0 && title.trim() && subtitle.trim()) ||
    (step === 1 && startDate && nightCount > 0) ||
    (step === 2 && venue.trim()) ||
    (step === 3) ||
    (step === 4)
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-foreground">
        {cloneFrom ? "Clone event" : "Create event"}
      </h1>
      {cloneFrom && (
        <p className="mt-1 text-sm text-muted-foreground">
          Cloning from <strong>{cloneFrom.title}</strong> — venue, zones, pass types, and policies are pre-filled.
        </p>
      )}

      <div className="mt-6 mb-8">
        <StepIndicator current={step} total={STEPS.length} />
        <p className="mt-2 text-sm font-medium text-foreground">{STEPS[step]}</p>
      </div>

      <div className="min-h-[320px] rounded-xl border border-border bg-surface p-6">
        {/* Step 0: Basics */}
        {step === 0 && (
          <div className="space-y-4">
            <Field label="Event name" required>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Manhar Navratri 2027" />
            </Field>
            <Field label="Tagline">
              <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Nine nights. Three zones. One ground." />
            </Field>
            <Field label="Category">
              <select
                className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="garba">Garba</option>
                <option value="raas">Raas</option>
                <option value="concert">Concert</option>
                <option value="festival">Festival</option>
              </select>
            </Field>
          </div>
        )}

        {/* Step 1: Dates */}
        {step === 1 && (
          <div className="space-y-4">
            <Field label="First night date" required>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="Number of nights" required>
              <div className="flex items-center gap-3">
                <button onClick={() => setNightCount((n) => Math.max(1, n - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-foreground hover:bg-surface-raised">−</button>
                <span className="w-8 text-center text-lg font-bold tabular-nums text-foreground">{nightCount}</span>
                <button onClick={() => setNightCount((n) => Math.min(14, n + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-foreground hover:bg-surface-raised">+</button>
              </div>
              {startDate && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {nightCount} nights auto-generated starting {startDate}
                </p>
              )}
            </Field>
          </div>
        )}

        {/* Step 2: Venue */}
        {step === 2 && (
          <div className="space-y-4">
            <Field label="Venue name" required>
              <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Sardar Patel Ground, Ahmedabad" />
            </Field>
            <Field label="Total capacity">
              <Input
                type="number"
                value={totalCapacity}
                onChange={(e) => setTotalCapacity(Number(e.target.value))}
              />
            </Field>
            <p className="text-xs text-muted-foreground">Zone breakdown (VIP / Gold / General) can be edited after creation in the Venue tab.</p>
          </div>
        )}

        {/* Step 3: Passes & Pricing */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {cloneFrom
                ? "Pass types, price tiers, and add-ons have been copied from last year. Review them in the Passes tab after creation."
                : "Default pass types (Season, Weekend, Daily) will be created automatically. You can edit or add more in the Passes tab."}
            </p>

            {/* Advanced collapsed by default — working defaults already set */}
            <div className="rounded-lg border border-border">
              <button
                onClick={() => setShowAdvanced((s) => !s)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm text-muted-foreground hover:text-foreground"
              >
                <span>Advanced options</span>
                <ChevronRight className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-90" : ""}`} />
              </button>
              {showAdvanced && (
                <div className="space-y-4 border-t border-border px-4 py-4">
                  <Field label="Re-entry policy">
                    <select
                      className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground"
                      value={reentryPolicy}
                      onChange={(e) => setReentryPolicy(e.target.value as "none" | "once" | "unlimited")}
                    >
                      <option value="unlimited">Unlimited re-entry</option>
                      <option value="once">Once only</option>
                      <option value="timed">Timed window</option>
                    </select>
                  </Field>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="gst" checked={gstEnabled} onChange={(e) => setGstEnabled(e.target.checked)} className="accent-primary" />
                    <label htmlFor="gst" className="text-sm text-foreground">Collect GST (18%)</label>
                  </div>
                  <Field label="Convenience fee (%)">
                    <Input
                      type="number" step="0.5" min={0} max={10}
                      value={convFeePct}
                      onChange={(e) => setConvFeePct(Number(e.target.value))}
                    />
                  </Field>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Review before publishing</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="text-foreground">{title || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Dates</dt>
                <dd className="text-foreground">{startDate ? `${startDate} (${nightCount} nights)` : "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Venue</dt>
                <dd className="text-foreground">{venue || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Re-entry</dt>
                <dd className="text-foreground capitalize">{reentryPolicy.replace("_", " ")}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">GST</dt>
                <dd className="text-foreground">{gstEnabled ? "18% collected" : "Not collected"}</dd>
              </div>
            </dl>
            <p className="mt-4 rounded-lg bg-surface-raised p-3 text-xs text-muted-foreground">
              The event will be saved as a draft. Use the Publish tab to go live after completing the pre-publish checklist.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => router.push("/dashboard/events")}>
            Cancel
          </Button>
        )}

        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
            Continue
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleFinish}>
            Save as draft
            <Check className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
