"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, Check, Copy } from "lucide-react";
import { Button, Input, Field, toast } from "@manhar-garba/ui";
import { bpsToPercent, PLATFORM_FEE_BPS, GATEWAY_FEE_BPS } from "@manhar-garba/domain";
import { useDashboardStore, type ReentryMode } from "@/lib/dashboard-store";
import { useHydrated } from "@/lib/use-hydrated";

const STEPS = ["Basics", "Dates & nights", "Venue", "Passes & fees", "Review"];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <ol className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <li key={i} className="flex items-center gap-2">
          <div
            className={[
              "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
              i < current ? "bg-success text-white" : i === current ? "bg-primary text-white" : "bg-surface-raised text-muted-foreground",
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

function nextYearDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export function EventWizard({ cloneFromId }: { cloneFromId: string | null }) {
  const hydrated = useHydrated();
  const source = useDashboardStore((s) => (cloneFromId ? s.events.find((e) => e.id === cloneFromId) : undefined));

  // The form's defaults depend on the clone source, which lives in
  // localStorage — so wait for it rather than seeding the form with nothing.
  if (!hydrated) return <div className="mx-auto max-w-2xl px-4 py-6 text-sm text-muted-foreground">Loading…</div>;
  return <WizardForm key={source?.id ?? "new"} sourceId={source?.id ?? null} />;
}

function WizardForm({ sourceId }: { sourceId: string | null }) {
  const router = useRouter();
  const createEvent = useDashboardStore((s) => s.createEvent);
  const source = useDashboardStore((s) => (sourceId ? s.events.find((e) => e.id === sourceId) : undefined));
  const sourceVenue = useDashboardStore((s) => s.venues.find((v) => v.id === source?.venue_id));
  const sourceNightCount = useDashboardStore((s) => (source ? s.nights.filter((n) => n.event_id === source.id).length : 9));
  const sourcePassCount = useDashboardStore((s) => (source ? s.passTypes.filter((p) => p.event_id === source.id).length : 0));

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState(source ? source.title.replace(/\b(20\d\d)\b/, (y) => String(Number(y) + 1)) : "");
  const [subtitle, setSubtitle] = useState(source?.subtitle ?? "");
  const [category, setCategory] = useState(source?.category ?? "garba");
  const [startDate, setStartDate] = useState(source ? nextYearDate(source.starts_on) : "");
  const [nightCount, setNightCount] = useState(sourceNightCount || 9);
  const [venueName, setVenueName] = useState(sourceVenue?.name ?? "");
  const [city, setCity] = useState(sourceVenue?.city ?? "");
  const [totalCapacity, setTotalCapacity] = useState(sourceVenue?.total_capacity ?? 10000);
  const [reentry, setReentry] = useState<ReentryMode>(
    source ? (source.reentry_window_minutes ? "timed" : source.reentry_policy === "none" ? "once" : (source.reentry_policy as ReentryMode)) : "unlimited"
  );

  const canNext =
    (step === 0 && title.trim().length > 2) ||
    (step === 1 && Boolean(startDate) && nightCount > 0) ||
    (step === 2 && venueName.trim() && city.trim() && totalCapacity > 0) ||
    step === 3 ||
    step === 4;

  function handleFinish() {
    const id = createEvent({
      title: title.trim(),
      subtitle: subtitle.trim(),
      category,
      startDate,
      nightCount,
      venueName: venueName.trim(),
      city: city.trim(),
      totalCapacity,
      reentry,
      cloneFromId: source?.id ?? null,
    });
    toast.success(source ? "Event cloned as a draft" : "Draft event created", {
      description: "Review the pass types and publish when you're ready.",
    });
    router.push(`/dashboard/events/${id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-foreground">{source ? "Clone event" : "Create event"}</h1>
      {source && (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Copy className="h-3.5 w-3.5" />
          Copying from <strong className="text-foreground">{source.title}</strong> — zones, {sourcePassCount} pass types,
          add-ons, night themes and policy come across. Sales, lineup and dates don&rsquo;t.
        </p>
      )}

      <div className="mb-8 mt-6">
        <StepIndicator current={step} total={STEPS.length} />
        <p className="mt-2 text-sm font-medium text-foreground">{STEPS[step]}</p>
      </div>

      <div className="min-h-[320px] rounded-xl border border-border bg-surface p-6">
        {step === 0 && (
          <div className="space-y-4">
            <Field label="Event name" required>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Manhar Navratri 2027" autoFocus />
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

        {step === 1 && (
          <div className="space-y-4">
            <Field label="First night" required>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="Number of nights" required>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setNightCount((n) => Math.max(1, n - 1))}
                  aria-label="Fewer nights"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground hover:bg-surface-raised"
                >
                  −
                </button>
                <span className="tabular w-8 text-center text-lg font-bold text-foreground">{nightCount}</span>
                <button
                  onClick={() => setNightCount((n) => Math.min(14, n + 1))}
                  aria-label="More nights"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground hover:bg-surface-raised"
                >
                  +
                </button>
              </div>
              {startDate && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Nights 1–{nightCount} will be created, one per day from {startDate}. Gates open 5pm, show 7pm — editable per
                  night afterwards.
                </p>
              )}
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Venue name" required>
                <Input value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="Sardar Patel Ground" />
              </Field>
              <Field label="City" required>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ahmedabad" />
              </Field>
            </div>
            <Field label="Total capacity">
              <Input
                type="number"
                min={100}
                value={totalCapacity}
                onChange={(e) => setTotalCapacity(Math.max(0, Number(e.target.value)))}
              />
            </Field>
            <p className="text-xs text-muted-foreground">
              {source
                ? "Zones and gates are copied from the source event. Adjust capacities in the Venue tab."
                : "Three zones are created from this capacity — VIP 10%, Gold 35%, General 55% — with one gate each. Rename or resize them in the Venue tab."}
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="rounded-lg border border-border bg-surface-raised p-3 text-sm text-muted-foreground">
              {source ? (
                <>All {sourcePassCount} pass types and their price tiers are copied with sold counts reset to zero.</>
              ) : (
                <>
                  Four starter pass types are created so the event is sellable straight away: <strong className="text-foreground">Season Solo — General</strong>,{" "}
                  <strong className="text-foreground">Season Couple — Gold</strong>, <strong className="text-foreground">Any One Night — General</strong> and{" "}
                  <strong className="text-foreground">Season VIP</strong>. Edit prices or add your own in the Passes tab.
                </>
              )}
            </div>

            <Field label="Re-entry">
              <select
                className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground"
                value={reentry}
                onChange={(e) => setReentry(e.target.value as ReentryMode)}
              >
                <option value="unlimited">Unlimited re-entry</option>
                <option value="once">Single entry only</option>
                <option value="timed">Timed re-entry window</option>
              </select>
            </Field>

            <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Fees are the same on every event</p>
              <p className="mt-1">
                ManharEvent platform fee {bpsToPercent(PLATFORM_FEE_BPS)} + payment gateway fee {bpsToPercent(GATEWAY_FEE_BPS)}, plus
                GST — always shown to buyers as separate lines at checkout. There&rsquo;s nothing to configure here.
              </p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Review</h2>
            <dl className="space-y-2 text-sm">
              {[
                ["Name", title || "—"],
                ["Dates", startDate ? `${startDate} · ${nightCount} nights` : "—"],
                ["Venue", venueName ? `${venueName}, ${city}` : "—"],
                ["Capacity", totalCapacity.toLocaleString("en-IN")],
                ["Re-entry", reentry],
                ["Starting from", source ? source.title : "ManharEvent Garba template"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right capitalize text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 rounded-lg bg-surface-raised p-3 text-xs text-muted-foreground">
              It&rsquo;s saved as a draft. Nobody can buy until you publish from the Publish tab.
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
            {source ? "Create clone" : "Create draft"}
            <Check className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
