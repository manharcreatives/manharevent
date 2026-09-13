"use client";

import { useState } from "react";
import { Music, Palette, Shirt, Pencil, Check } from "lucide-react";
import { Button, Input, Field, toast } from "@manhar-garba/ui";
import { artists as allArtists } from "@manhar-garba/mock-data";
import type { EventNight } from "@manhar-garba/domain";
import { useDashboardStore } from "@/lib/dashboard-store";
import { useEventScope } from "@/lib/use-event";

/** Times are held as ISO strings; the editor works in local `HH:MM`. */
function toTimeInput(iso: string | null): string {
  return iso ? iso.slice(11, 16) : "";
}

function withTime(iso: string | null, date: string, hhmm: string): string | null {
  if (!hhmm) return null;
  // Preserve the original ISO shape (and its Z suffix) so nothing downstream
  // has to special-case a night edited from the dashboard.
  const base = iso ?? `${date}T00:00:00Z`;
  return `${base.slice(0, 11)}${hhmm}${base.slice(16)}`;
}

export default function NightsPage() {
  const { nights } = useEventScope();
  const lineupByNight = useDashboardStore((s) => s.lineupByNight);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lineupFor, setLineupFor] = useState<string | null>(null);

  const artistName = Object.fromEntries(allArtists.map((a) => [a.id, a.name]));

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-xl font-bold text-foreground">Nights &amp; themes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {nights.length} nights. Theme, dress code, and lineup show on the public event page.
        </p>
      </div>

      <ul className="space-y-3">
        {nights.map((night) => {
          const lineup = lineupByNight[night.id] ?? [];

          if (editingId === night.id) {
            return (
              <li key={night.id}>
                <NightEditor night={night} onDone={() => setEditingId(null)} />
              </li>
            );
          }

          return (
            <li key={night.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                    style={{ backgroundColor: night.theme_color ?? "hsl(var(--primary))" }}
                  >
                    {night.night_number}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">Night {night.night_number}</p>
                      <span className="text-sm text-muted-foreground">{night.date}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {night.theme && (
                        <span className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-foreground">
                          <Palette className="h-3 w-3" /> {night.theme}
                        </span>
                      )}
                      {night.dress_code && (
                        <span className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-foreground">
                          <Shirt className="h-3 w-3" /> {night.dress_code}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Gates open {toTimeInput(night.gates_open_at) || "—"} IST · Show{" "}
                      {toTimeInput(night.starts_at) || "—"} IST
                    </p>
                    {lineup.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        <Music className="mr-1 inline h-3 w-3" />
                        {lineup.map((id) => artistName[id] ?? "Unknown").join(" · ")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setLineupFor(lineupFor === night.id ? null : night.id)}
                  >
                    <Music className="mr-1.5 h-3.5 w-3.5" />
                    Lineup ({lineup.length})
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(night.id);
                      setLineupFor(null);
                    }}
                    aria-label={`Edit night ${night.night_number}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {lineupFor === night.id && <LineupPicker nightId={night.id} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const THEME_COLORS = [
  "hsl(14 92% 56%)",
  "hsl(42 96% 58%)",
  "hsl(282 74% 62%)",
  "hsl(190 80% 50%)",
  "hsl(152 66% 45%)",
  "hsl(330 75% 60%)",
];

function NightEditor({ night, onDone }: { night: EventNight; onDone: () => void }) {
  const updateNight = useDashboardStore((s) => s.updateNight);

  const [theme, setTheme] = useState(night.theme ?? "");
  const [dressCode, setDressCode] = useState(night.dress_code ?? "");
  const [color, setColor] = useState(night.theme_color ?? THEME_COLORS[0]!);
  const [gatesOpen, setGatesOpen] = useState(toTimeInput(night.gates_open_at));
  const [startsAt, setStartsAt] = useState(toTimeInput(night.starts_at));
  const [endsAt, setEndsAt] = useState(toTimeInput(night.ends_at));
  const [notes, setNotes] = useState(night.notes ?? "");

  function save() {
    updateNight(night.id, {
      theme: theme.trim() || null,
      dress_code: dressCode.trim() || null,
      theme_color: color,
      gates_open_at: withTime(night.gates_open_at, night.date, gatesOpen),
      starts_at: withTime(night.starts_at, night.date, startsAt),
      ends_at: withTime(night.ends_at, night.date, endsAt),
      notes: notes.trim() || null,
    });
    toast.success(`Night ${night.night_number} updated`);
    onDone();
  }

  return (
    <div className="space-y-4 rounded-xl border border-primary/40 bg-surface p-4">
      <p className="font-medium text-foreground">
        Night {night.night_number} · {night.date}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Theme">
          <Input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Traditional Chaniya Choli" />
        </Field>
        <Field label="Dress code">
          <Input value={dressCode} onChange={(e) => setDressCode(e.target.value)} placeholder="Traditional only" />
        </Field>
      </div>

      <div>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Theme colour
        </span>
        <div className="mt-2 flex gap-2">
          {THEME_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              aria-label={`Theme colour ${c}`}
              aria-pressed={color === c}
              className="flex h-8 w-8 items-center justify-center rounded-lg ring-offset-2 ring-offset-surface transition-all"
              style={{ backgroundColor: c, boxShadow: color === c ? "0 0 0 2px hsl(var(--foreground))" : undefined }}
            >
              {color === c && <Check className="h-4 w-4 text-white" />}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Gates open">
          <Input type="time" value={gatesOpen} onChange={(e) => setGatesOpen(e.target.value)} />
        </Field>
        <Field label="Show starts">
          <Input type="time" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </Field>
        <Field label="Ends">
          <Input type="time" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </Field>
      </div>

      <Field label="Internal notes (not shown to buyers)">
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Extra bouncers on Gate 3" />
      </Field>

      <div className="flex gap-2">
        <Button size="sm" onClick={save}>
          Save night
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

/**
 * Order matters: the first artist is the headliner, and that's what the public
 * night card shows. So this picks by click order rather than sorting the list.
 */
function LineupPicker({ nightId }: { nightId: string }) {
  const lineup = useDashboardStore((s) => s.lineupByNight[nightId] ?? []);
  const setNightLineup = useDashboardStore((s) => s.setNightLineup);

  function toggle(artistId: string) {
    const next = lineup.includes(artistId)
      ? lineup.filter((id) => id !== artistId)
      : [...lineup, artistId];
    setNightLineup(nightId, next);
  }

  return (
    <div className="mt-4 space-y-2 rounded-lg border border-border bg-surface-sunken p-3">
      <p className="text-xs text-muted-foreground">
        Tap to add or remove. The first one picked is billed as the headliner.
      </p>
      <div className="flex flex-wrap gap-2">
        {allArtists.map((a) => {
          const index = lineup.indexOf(a.id);
          const on = index >= 0;
          return (
            <button
              key={a.id}
              onClick={() => toggle(a.id)}
              aria-pressed={on}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                on
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {on && (
                <span className="tabular rounded-full bg-black/20 px-1.5 text-[10px]">
                  {index + 1}
                </span>
              )}
              {a.name}
            </button>
          );
        })}
      </div>
      {lineup.length === 0 && (
        <p className="text-xs text-warning">
          No artists on this night yet — the public page will show the theme only.
        </p>
      )}
    </div>
  );
}
