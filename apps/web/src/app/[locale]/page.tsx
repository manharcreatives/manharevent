import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@manhar-garba/ui";
import {
  getTenantBySlug,
  getTenantBranding,
  listPublishedEvents,
  listEventNights,
  listArtists,
  listLineupForNight,
  listZones,
  getVenue,
} from "@manhar-garba/mock-data";
import { ZoneCardsSection } from "@/components/event/zone-cards-section";
import { NightTile } from "@/components/event/night-tile";
import { HeroBackdrop } from "@/components/home/hero-backdrop";
import { HeroNightWheel } from "@/components/home/hero-night-wheel";
import { Shield, MapPin, ArrowRight, CalendarDays, MessageCircle } from "lucide-react";
import { localeAlternates } from "@/lib/seo";

// Home is the ORGANIZER's own event landing, not a ManharEvent-wide
// discovery page (2026-09-12 pivot, manharevents-screen-specs.md §1.1).
// City search, the cross-organizer EventCard grid, and the "N organizers
// live" trust badge are gone — a visitor lands here already knowing whose
// event this is, from the organizer's own domain.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Home" });
  const tenant = await getTenantBySlug("manhar");
  const branding = tenant ? await getTenantBranding(tenant.id) : null;
  return {
    title: { absolute: branding?.meta_title ?? tenant?.display_name ?? "ManharEvent" },
    description: branding?.meta_description ?? t("heroSubtitle"),
    alternates: localeAlternates("/", locale),
  };
}

function formatNightDate(iso: string, locale: string) {
  const localeTag = locale === "gu" ? "gu-IN" : locale === "hi" ? "hi-IN" : "en-IN";
  return new Date(`${iso}T00:00:00+05:30`).toLocaleDateString(localeTag, {
    month: "short",
    day: "numeric",
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Home");
  const tEvent = await getTranslations("Event");

  const tenant = await getTenantBySlug("manhar");
  const events = tenant ? await listPublishedEvents(tenant.id) : [];
  const event = events[0] ?? null;

  let nights: Awaited<ReturnType<typeof listEventNights>> = [];
  let artists: Awaited<ReturnType<typeof listArtists>> = [];
  let zones: Awaited<ReturnType<typeof listZones>> = [];
  let venue: Awaited<ReturnType<typeof getVenue>> = null;
  if (event && tenant) {
    [nights, artists, zones, venue] = await Promise.all([
      listEventNights(event.id),
      listArtists(tenant.id),
      listZones(event.id),
      event.venue_id ? getVenue(event.venue_id) : Promise.resolve(null),
    ]);
  }

  const nightsWithLineup = await Promise.all(
    nights.map(async (night) => {
      const lineup = await listLineupForNight(night.id);
      const artistId = lineup[0]?.artist_id;
      const artist = artistId ? artists.find((a) => a.id === artistId) : undefined;
      return { night, headlineArtist: artist?.name };
    })
  );

  const organizerName = tenant?.display_name ?? "";
  const eventHref = event ? `/e/${event.slug}` : "/";
  const bookHref = event ? `/e/${event.slug}/book` : "/";
  const firstNight = nights[0];
  const lastNight = nights[nights.length - 1];

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────────
          Two columns from `lg` up: the promise on the left, the nine nights
          drawn on the right. Before this the hero was a headline, a subtitle
          and two buttons alone in roughly four hundred pixels of nothing. */}
      <section className="relative isolate overflow-hidden border-b border-border/60 bg-background">
        <HeroBackdrop className="pointer-events-none absolute inset-0 -z-10 opacity-80" />

        <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-4 pb-14 pt-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:gap-14 lg:px-8 lg:pb-20 lg:pt-16">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            {firstNight && (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {t("heroEyebrow", { year: new Date(`${firstNight.date}T00:00:00+05:30`).getFullYear() })}
              </p>
            )}
            <h1 className="mt-3 text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">{t("heroSubtitle")}</p>

            {/* Where and when — the two facts a visitor checks before anything else */}
            {(venue || nights.length > 0) && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground lg:justify-start">
                {firstNight && lastNight && (
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                    {formatNightDate(firstNight.date, locale)} – {formatNightDate(lastNight.date, locale)} ·{" "}
                    {tEvent("nightsCount", { count: nights.length })}
                  </span>
                )}
                {venue && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                    {venue.name}, {venue.city}
                  </span>
                )}
              </div>
            )}

            {/* One unmistakable primary action, with a quieter secondary beside it */}
            <div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Button asChild size="lg" className="shadow-[var(--shadow-glow)]">
                <Link href={bookHref}>
                  {tEvent("bookPasses")}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={eventHref}>{tEvent("about")}</Link>
              </Button>
            </div>

            {/* Single-organizer trust strip — replaces the old "N organizers · N cities" badge */}
            <p className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-border/60 bg-surface/70 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-sm lg:justify-start">
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                {tEvent("securedBy")}
              </span>
              {organizerName && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    {tEvent("organiserInfo")} {organizerName}
                  </span>
                </>
              )}
            </p>
          </div>

          <HeroNightWheel
            className="order-first w-full lg:order-none"
            nights={nights.map((n) => ({ nightNumber: n.night_number, themeColor: n.theme_color }))}
            nightsLabel={tEvent("nightLineup")}
            onePassLabel={t("heroSubtitle")}
            ariaLabel={t("heroTitle")}
          />
        </div>
      </section>

      {/* ── Zones and prices ─────────────────────────────────────────── */}
      {event && zones.length > 0 && (
        <section className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-foreground">{tEvent("zones")}</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">{tEvent("zonesSubtitle")}</p>
          <ZoneCardsSection zones={zones} eventId={event.id} eventSlug={event.slug} />
        </section>
      )}

      {/* ── Night-by-night lineup ────────────────────────────────────── */}
      {nightsWithLineup.length > 0 && event && (
        <section className="mx-auto max-w-[1280px] px-4 pb-14 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">{tEvent("nightLineup")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("nightLineupSubtitle")}</p>
            </div>
            <Link
              href={`/e/${event.slug}/lineup`}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              {tEvent("seeAllNights")} →
            </Link>
          </div>

          <div className="-mx-4 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-5 xl:grid-cols-9">
            {nightsWithLineup.map(({ night, headlineArtist }) => (
              // Each card navigates to that night's page. Before this they
              // looked exactly like buttons and did nothing when tapped.
              <Link
                key={night.id}
                href={`/e/${event.slug}/night/${night.night_number}`}
                className="group w-36 shrink-0 snap-start rounded-2xl focus-visible:outline-none sm:w-auto sm:shrink"
                aria-label={`${tEvent("nightNumber", { number: night.night_number })} — ${night.theme ?? ""}`}
              >
                <NightTile
                  nightNumber={night.night_number}
                  date={formatNightDate(night.date, locale)}
                  themeName={night.theme ?? ""}
                  dressCode={night.dress_code}
                  headlineArtist={headlineArtist}
                  accentColor={night.theme_color}
                  interactive
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Closing call to action ───────────────────────────────────────
          Deliberately NOT the hero headline again — that band used to repeat
          it word for word. This one closes on delivery, which is the last
          thing a buyer worries about before paying. */}
      {event && (
        <section className="mx-auto max-w-[1280px] px-4 pb-24 sm:px-6 lg:px-8 md:pb-16">
          <div className="relative isolate overflow-hidden rounded-3xl border border-border bg-surface px-6 py-12 text-center sm:px-10">
            <div
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(ellipse 60% 100% at 50% 0%, hsl(var(--primary) / 0.14) 0%, transparent 70%)",
              }}
              aria-hidden="true"
            />
            <h2 className="mx-auto max-w-xl text-balance font-display text-2xl font-bold text-foreground sm:text-3xl">
              {t("closingTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              {t("closingBody")}
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href={bookHref}>
                  {tEvent("bookPasses")}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              {tenant?.support_phone && (
                <Button asChild size="lg" variant="outline">
                  <a
                    href={`https://wa.me/${tenant.support_phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="mr-1.5 h-4 w-4" />
                    {tEvent("whatsappSupport")}
                  </a>
                </Button>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
