import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button, NightCard } from "@manhar-garba/ui";
import {
  getEventBySlug,
  getTenantBySlug,
  getVenue,
  listZones,
  listEventNights,
  listArtists,
  listLineupForNight,
} from "@manhar-garba/mock-data";
import { eventFromPricePaise } from "@/lib/pricing";
import { TrustStrip } from "@/components/event/trust-strip";
import { ZoneCardsSection } from "@/components/event/zone-cards-section";
import { PassCardsSection } from "@/components/event/pass-cards-section";
import { StickyBookBar } from "@/components/event/sticky-book-bar";

// Event landing page (manharevents-screen-specs.md §1.2). Gallery/FAQ are
// intentionally left out for now — both need real event photography, which
// per Utsav's own instruction (2026-09-12) is generated via ChatGPT only
// once the platform's coding is finished, not before.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; eventSlug: string }>;
}): Promise<Metadata> {
  const { eventSlug } = await params;
  const event = await getEventBySlug(eventSlug);
  if (!event) return {};
  return {
    title: event.title,
    description: event.subtitle ?? undefined,
  };
}

function formatDateRange(startsOn: string, endsOn: string, locale: string) {
  const localeTag = locale === "gu" ? "gu-IN" : locale === "hi" ? "hi-IN" : "en-IN";
  const start = new Date(`${startsOn}T00:00:00+05:30`);
  const end = new Date(`${endsOn}T00:00:00+05:30`);
  const fmt = new Intl.DateTimeFormat(localeTag, { month: "short", day: "numeric" });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

function formatNightDate(iso: string, locale: string) {
  const localeTag = locale === "gu" ? "gu-IN" : locale === "hi" ? "hi-IN" : "en-IN";
  return new Date(`${iso}T00:00:00+05:30`).toLocaleDateString(localeTag, {
    month: "short",
    day: "numeric",
  });
}

export default async function EventLandingPage({
  params,
}: {
  params: Promise<{ locale: string; eventSlug: string }>;
}) {
  const { locale, eventSlug } = await params;
  setRequestLocale(locale);

  const event = await getEventBySlug(eventSlug);
  if (!event) notFound();

  const t = await getTranslations("Event");

  const [tenant, venue, zones, nights] = await Promise.all([
    getTenantBySlug("manhar"),
    event.venue_id ? getVenue(event.venue_id) : Promise.resolve(undefined),
    listZones(event.id),
    listEventNights(event.id),
  ]);

  const artists = tenant ? await listArtists(tenant.id) : [];
  const nightsWithLineup = await Promise.all(
    nights.map(async (night) => {
      const lineup = await listLineupForNight(night.id);
      const artistId = lineup[0]?.artist_id;
      const artist = artistId ? artists.find((a) => a.id === artistId) : undefined;
      return { night, headlineArtist: artist?.name };
    })
  );

  // USR-11/HOME-31/USR-12: this used to be min(all tiers) — including
  // expired early-bird windows and sold-out pass types — so the hero could
  // quote a price nobody could actually book. eventFromPricePaise only
  // considers on-sale, in-stock, currently-active tiers.
  const priceFromPaise = (await eventFromPricePaise(event.id)) ?? 0;

  return (
    <>
      <section className="relative overflow-hidden bg-background">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            background:
              "radial-gradient(ellipse at 70% 20%, hsl(var(--primary)/0.4) 0%, transparent 60%), radial-gradient(ellipse at 10% 90%, hsl(var(--accent)/0.3) 0%, transparent 55%)",
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-[1280px] px-4 pb-8 pt-14 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {event.title}
          </h1>
          {event.subtitle && <p className="mt-2 text-lg text-muted-foreground">{event.subtitle}</p>}
          <p className="mt-3 text-sm text-muted-foreground">
            {formatDateRange(event.starts_on, event.ends_on, locale)}
            {venue && <> · {venue.name}, {venue.city}</>}
          </p>

          <div className="mt-6 flex items-center gap-3">
            <Button asChild size="lg">
              <Link href={`/e/${event.slug}/book`}>{t("bookPasses")}</Link>
            </Button>
            {priceFromPaise > 0 && (
              <span className="text-sm text-muted-foreground">
                {t("priceFrom", { price: `₹${Math.round(priceFromPaise / 100).toLocaleString("en-IN")}` })}
              </span>
            )}
          </div>

          <TrustStrip supportPhone={tenant?.support_phone ?? "+919876543210"} />
        </div>
      </section>

      {event.description && (
        <section className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="font-display text-xl font-bold text-foreground">{t("about")}</h2>
          <p className="mt-3 max-w-[720px] text-sm leading-relaxed text-muted-foreground">
            {event.description}
          </p>
        </section>
      )}

      {nightsWithLineup.length > 0 && (
        <section className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="font-display text-xl font-bold text-foreground">{t("nightLineup")}</h2>
          <div className="mt-4 -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-5 xl:grid-cols-9">
            {nightsWithLineup.map(({ night, headlineArtist }) => (
              <NightCard
                key={night.id}
                nightNumber={night.night_number}
                date={formatNightDate(night.date, locale)}
                themeName={night.theme ?? ""}
                dresscode={night.dress_code ?? undefined}
                headlineArtist={headlineArtist}
                accentColor={night.theme_color ?? undefined}
                className="sm:w-auto"
              />
            ))}
          </div>
        </section>
      )}

      {/* Open ground (zones.length <= 1 — most Garba grounds sell one
          general ticket, no VIP/Gold split): pass cards, no zone map. The
          zoned event below this check is completely unchanged. */}
      {zones.length === 1 ? (
        <section className="mx-auto max-w-[1280px] px-4 py-8 pb-16 sm:px-6 lg:px-8 md:pb-8">
          <h2 className="font-display text-xl font-bold text-foreground">{t("passesTitle")}</h2>
          <PassCardsSection eventId={event.id} eventSlug={event.slug} />
        </section>
      ) : (
        zones.length > 0 && (
          <section className="mx-auto max-w-[1280px] px-4 py-8 pb-16 sm:px-6 lg:px-8 md:pb-8">
            <h2 className="font-display text-xl font-bold text-foreground">{t("zones")}</h2>
            <ZoneCardsSection zones={zones} eventId={event.id} eventSlug={event.slug} />
          </section>
        )
      )}

      {venue && (
        <section className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="font-display text-xl font-bold text-foreground">{t("venueTitle")}</h2>
          <div className="mt-3 rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{venue.name}</p>
            <p className="mt-1">{venue.address}, {venue.city}, {venue.state} {venue.pincode}</p>
            {venue.google_maps_url && (
              <a
                href={venue.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-primary hover:underline"
              >
                {t("howToReach")}
              </a>
            )}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1280px] px-4 py-8 pb-24 sm:px-6 lg:px-8 md:pb-8">
        <h2 className="font-display text-xl font-bold text-foreground">{t("refundPolicy")}</h2>
        <p className="mt-3 max-w-[720px] text-sm leading-relaxed text-muted-foreground">
          <Link href="/legal/refund-policy" className="text-primary hover:underline">
            {t("refundPolicy")}
          </Link>
        </p>
      </section>

      {priceFromPaise > 0 && <StickyBookBar eventSlug={event.slug} pricePaise={priceFromPaise} />}
    </>
  );
}
