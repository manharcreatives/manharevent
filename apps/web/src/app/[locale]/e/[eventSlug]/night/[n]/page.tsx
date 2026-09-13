import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button, NightCard } from "@manhar-garba/ui";
import { getEventBySlug, listEventNights, listLineupForNight, listArtists } from "@manhar-garba/mock-data";
import { ChevronLeft, Music, ArrowRight } from "lucide-react";

function localeTag(locale: string) {
  return locale === "gu" ? "gu-IN" : locale === "hi" ? "hi-IN" : "en-IN";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; eventSlug: string; n: string }>;
}): Promise<Metadata> {
  const { eventSlug, n } = await params;
  const event = await getEventBySlug(eventSlug);
  if (!event) return {};
  const nights = await listEventNights(event.id);
  const nightNum = parseInt(n, 10);
  const night = nights.find((ni) => ni.night_number === nightNum);
  if (!night) return {};
  return {
    title: `Night ${nightNum} — ${night.theme ?? event.title}`,
    description: `Night ${nightNum} of ${event.title}. ${night.theme ?? ""} ${night.dress_code ? `Dress code: ${night.dress_code}` : ""}`.trim(),
  };
}

export default async function NightPage({
  params,
}: {
  params: Promise<{ locale: string; eventSlug: string; n: string }>;
}) {
  const { locale, eventSlug, n } = await params;
  setRequestLocale(locale);

  const nightNum = parseInt(n, 10);
  const event = await getEventBySlug(eventSlug);
  if (!event) notFound();

  const nights = await listEventNights(event.id);
  const night = nights.find((ni) => ni.night_number === nightNum);
  if (!night) notFound();

  const [lineup, artists] = await Promise.all([listLineupForNight(night.id), listArtists(event.tenant_id)]);
  const performing = lineup
    .sort((a, b) => a.billing - b.billing)
    .map((l) => ({ slot: l, artist: artists.find((a) => a.id === l.artist_id) }))
    .filter((x) => x.artist);

  const tag = localeTag(locale);
  // Dates were printed raw as "2026-10-02".
  const dateLabel = new Date(`${night.date}T00:00:00+05:30`).toLocaleDateString(tag, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const shortDate = (iso: string) =>
    new Date(`${iso}T00:00:00+05:30`).toLocaleDateString(tag, { day: "numeric", month: "short" });
  const time = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString(tag, { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }) : null;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-6 gap-1">
        <Link href={`/e/${eventSlug}`}>
          <ChevronLeft className="h-4 w-4" />
          Back to event
        </Link>
      </Button>

      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <NightCard
          nightNumber={night.night_number}
          date={shortDate(night.date)}
          themeName={night.theme ?? `Night ${night.night_number}`}
          dresscode={night.dress_code ?? undefined}
          accentColor={night.theme_color ?? undefined}
          className="h-64 w-48 shrink-0"
        />

        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{event.title}</p>
          <h1 className="font-display text-3xl font-bold text-foreground">Night {night.night_number}</h1>
          {night.theme && <p className="mt-1 text-xl text-muted-foreground">{night.theme}</p>}

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-muted-foreground">Date</dt>
              <dd className="text-foreground">{dateLabel}</dd>
            </div>
            {time(night.gates_open_at) && (
              <div className="flex gap-3">
                <dt className="w-28 shrink-0 text-muted-foreground">Gates open</dt>
                <dd className="text-foreground">{time(night.gates_open_at)}</dd>
              </div>
            )}
            {time(night.starts_at) && (
              <div className="flex gap-3">
                <dt className="w-28 shrink-0 text-muted-foreground">Garba starts</dt>
                <dd className="text-foreground">{time(night.starts_at)}</dd>
              </div>
            )}
            {night.dress_code && (
              <div className="flex gap-3">
                <dt className="w-28 shrink-0 text-muted-foreground">Dress code</dt>
                <dd className="text-foreground">{night.dress_code}</dd>
              </div>
            )}
          </dl>

          <div className="mt-6">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Music className="h-3 w-3" /> Performing tonight
            </p>
            {performing.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Artists to be announced</p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-2">
                {performing.map(({ slot, artist }, i) => (
                  <li key={slot.id}>
                    <Link
                      href={`/artist/${artist!.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-3 py-1 text-sm transition-colors hover:border-primary hover:text-primary"
                    >
                      {i === 0 && <span className="text-[10px] font-bold uppercase text-primary">Headliner</span>}
                      {artist!.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Button asChild size="lg" className="mt-8">
            <Link href={`/e/${eventSlug}/book`}>
              Book passes <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Season passes cover this night along with the others; single-night passes are valid for any one night.
          </p>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-xl font-bold text-foreground">Other nights</h2>
        <div className="-mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {nights
            .filter((ni) => ni.id !== night.id)
            .map((ni) => (
              <Link key={ni.id} href={`/e/${eventSlug}/night/${ni.night_number}`} className="group shrink-0 rounded-xl">
                <NightCard
                  nightNumber={ni.night_number}
                  date={shortDate(ni.date)}
                  themeName={ni.theme ?? `Night ${ni.night_number}`}
                  dresscode={ni.dress_code ?? undefined}
                  accentColor={ni.theme_color ?? undefined}
                  interactive
                />
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
