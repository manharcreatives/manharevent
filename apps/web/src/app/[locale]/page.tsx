import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button, NightCard } from "@manhar-garba/ui";
import {
  getTenantBySlug,
  getTenantBranding,
  listPublishedEvents,
  listEventNights,
  listArtists,
  listLineupForNight,
} from "@manhar-garba/mock-data";
import { Shield } from "lucide-react";

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
  const t = await getTranslations({ locale, namespace: "Home" });
  const tenant = await getTenantBySlug("manhar");
  const branding = tenant ? await getTenantBranding(tenant.id) : null;
  return {
    title: { absolute: branding?.meta_title ?? tenant?.display_name ?? "ManharEvent" },
    description: branding?.meta_description ?? t("heroSubtitle"),
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
  if (event && tenant) {
    [nights, artists] = await Promise.all([listEventNights(event.id), listArtists(tenant.id)]);
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
  const bookHref = event ? `/e/${event.slug}` : "/";

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[55vh] overflow-hidden bg-background">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at 60% 40%, hsl(var(--primary)/0.4) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, hsl(var(--accent)/0.3) 0%, transparent 55%)",
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-[1280px] flex-col items-center px-4 pb-12 pt-20 text-center sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{t("heroSubtitle")}</p>

          {/* Single-organizer trust strip — replaces the old "N organizers · N cities" badge */}
          <p className="mt-6 flex items-center gap-1.5 rounded-full border border-border/50 bg-surface/50 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
            <Shield className="h-3.5 w-3.5 text-success" aria-hidden="true" />
            {tEvent("securedBy")}
            {organizerName && (
              <>
                <span aria-hidden="true">·</span>
                {tEvent("organiserInfo")} {organizerName}
              </>
            )}
          </p>

          {/* The one primary action on this page */}
          <Button asChild size="lg" className="mt-8">
            <Link href={bookHref}>{tEvent("bookPasses")}</Link>
          </Button>
        </div>
      </section>

      {/* Night-by-night lineup preview */}
      {nightsWithLineup.length > 0 && (
        <section className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-foreground">{tEvent("nightLineup")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("nightLineupSubtitle")}</p>

          <div className="mt-6 -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-5 xl:grid-cols-9">
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
    </>
  );
}
