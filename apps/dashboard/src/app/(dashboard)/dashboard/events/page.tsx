"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Plus, Calendar, ArrowRight, Search, CalendarPlus, Eye, ExternalLink, Share2,
} from "lucide-react";
import { Button, EmptyState, Input, Money, StatTile, toast } from "@manhar-garba/ui";
import { listMyEventsAction, setMyEventStatusAction, type MyEventSummary } from "@/app/actions/org";
import { ShareEventDialog } from "@/components/org/share-event-dialog";

const WEB_APP_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";

type StatusFilter = "all" | "published" | "draft" | "ended";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Live" },
  { value: "draft", label: "Drafts" },
  { value: "ended", label: "Past" },
];

const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
  published: { label: "Live", cls: "bg-success/15 text-success" },
  draft: { label: "Draft", cls: "bg-surface-raised text-muted-foreground" },
  ended: { label: "Ended", cls: "bg-surface-raised text-muted-foreground" },
};

/** `2026-10-02` → `2 Oct 2026`, the way an organizer reads a date. */
function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/**
 * The organizer's list of seasons — M1 (2026-09-15): tenant-scoped and
 * server-driven (`listMyEventsAction`, the shared store), so every approved
 * organizer sees this same screen with their own events, not just Manhar's
 * `dashboard-store.ts` Zustand state. See PROGRESS.md decision log.
 *
 * Clone is deliberately not here yet — `cloneEventForTenant` is M2 work.
 */
export default function EventsPage() {
  const [events, setEvents] = useState<MyEventSummary[] | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [sharing, setSharing] = useState<MyEventSummary | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    listMyEventsAction().then(setEvents);
  }, []);

  const visible = useMemo(() => {
    if (!events) return [];
    const q = query.trim().toLowerCase();
    return events.filter((ev) => {
      if (filter !== "all" && ev.status !== filter) return false;
      if (!q) return true;
      return `${ev.title} ${ev.subtitle ?? ""} ${ev.slug}`.toLowerCase().includes(q);
    });
  }, [events, query, filter]);

  function togglePublish(event: MyEventSummary) {
    const next = event.status === "published" ? "draft" : "published";
    startTransition(async () => {
      const result = await setMyEventStatusAction(event.id, next);
      if (result.ok) {
        setEvents((prev) => prev?.map((e) => (e.id === event.id ? { ...e, status: next } : e)) ?? prev);
        toast.success(next === "published" ? "Event published" : "Event unpublished");
      } else {
        toast.error("Couldn't update — try again.");
      }
    });
  }

  if (events === null) {
    return <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted-foreground sm:px-6">Loading…</div>;
  }

  const live = events.filter((e) => e.status === "published").length;
  const drafts = events.filter((e) => e.status === "draft").length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Events</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {events.length} season{events.length === 1 ? "" : "s"} · {live} live · {drafts} draft
            {drafts === 1 ? "" : "s"}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/events/new">
            <Plus className="mr-1.5 h-4 w-4" />
            New event
          </Link>
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events by name or tagline"
            aria-label="Search events"
            className="h-11 pl-9"
          />
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:pb-0" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              aria-pressed={filter === f.value}
              className={`min-h-11 whitespace-nowrap rounded-full border px-3.5 text-xs font-medium transition-colors sm:min-h-0 sm:py-2 ${
                filter === f.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<CalendarPlus />}
          title={events.length === 0 ? "No events yet" : "Nothing matches that"}
          description={
            events.length === 0
              ? "Create your first event — a starter set of passes is set up for you in under a minute."
              : "Try another name, or clear the filters to see every season."
          }
          action={
            events.length === 0 ? (
              <Button asChild size="sm">
                <Link href="/dashboard/events/new">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create your first event
                </Link>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
              >
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <ul className="space-y-4">
          {visible.map((event) => {
            const chip = STATUS_CHIP[event.status] ?? STATUS_CHIP.draft!;
            return (
              <li
                key={event.id}
                className="overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-primary/40"
              >
                <div className="flex flex-wrap items-start gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/dashboard/events/${event.id}`}
                        className="truncate font-semibold text-foreground hover:text-primary"
                      >
                        {event.title}
                      </Link>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${chip.cls}`}>
                        {chip.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {fmtDate(event.starts_on)} — {fmtDate(event.ends_on)} · {event.nightsCount} night
                      {event.nightsCount === 1 ? "" : "s"} · {event.timingLabel}
                    </p>
                    {event.subtitle && <p className="text-sm text-muted-foreground">{event.subtitle}</p>}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {event.status === "published" && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => setSharing(event)}>
                          <Share2 className="mr-1.5 h-3.5 w-3.5" />
                          Share
                        </Button>
                        <a
                          href={`${WEB_APP_URL}/en/e/${event.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                          aria-label={`Open the public booking page for ${event.title}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Public page
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </>
                    )}
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => togglePublish(event)}>
                      {event.status === "published" ? "Unpublish" : "Publish"}
                    </Button>
                    <Button asChild size="sm">
                      <Link href={`/dashboard/events/${event.id}`}>
                        Manage <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* The numbers that decide which season gets tonight's attention. */}
                <div className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
                  <StatTile
                    label="Passes sold"
                    value={event.passesSold.toLocaleString("en-IN")}
                    sub={`${event.admitsSold.toLocaleString("en-IN")} people`}
                    className="rounded-none border-0"
                  />
                  <StatTile
                    label="Ticket sales"
                    value={<Money paise={event.grossPaise} />}
                    sub="Season to date"
                    className="rounded-none border-0"
                  />
                  <StatTile
                    label="Capacity"
                    value={event.capacity.toLocaleString("en-IN")}
                    sub={`${event.zonesCount} zone${event.zonesCount === 1 ? "" : "s"} per night`}
                    className="rounded-none border-0"
                  />
                  <StatTile
                    label="Pass types"
                    value={event.passTypesCount.toLocaleString("en-IN")}
                    sub={event.passTypesCount === 0 ? "None set up yet" : "On sale"}
                    className="rounded-none border-0"
                  />
                </div>

                <div className="-mx-px flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-4 py-2.5 text-xs">
                  {[
                    { href: "nights", label: "Nights" },
                    { href: "passes", label: "Passes" },
                    { href: "attendees", label: "Attendees" },
                    { href: "reports", label: "Reports" },
                    { href: "publish", label: event.status === "published" ? "Share" : "Publish" },
                  ].map((tab) => (
                    <Link
                      key={tab.href}
                      href={`/dashboard/events/${event.id}/${tab.href}`}
                      className="py-1.5 text-muted-foreground transition-colors hover:text-primary"
                    >
                      {tab.label}
                    </Link>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {sharing && (
        <ShareEventDialog
          event={{
            slug: sharing.slug,
            title: sharing.title,
            starts_on: sharing.starts_on,
            ends_on: sharing.ends_on,
          }}
          onOpenChange={(open) => !open && setSharing(null)}
        />
      )}
    </div>
  );
}
