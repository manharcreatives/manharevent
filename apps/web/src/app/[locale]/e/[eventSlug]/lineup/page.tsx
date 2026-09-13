import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button, NightCard } from "@manhar-garba/ui";
import { getEventBySlug, listEventNights, listArtists, listLineupForNight } from "@manhar-garba/mock-data";
import { ChevronLeft, Music } from "lucide-react";

function formatDate(iso: string, locale: string) {
  const tag = locale === "gu" ? "gu-IN" : locale === "hi" ? "hi-IN" : "en-IN";
  return new Date(`${iso}T00:00:00+05:30`).toLocaleDateString(tag, { weekday: "short", day: "numeric", month: "short" });
}

export default async function LineupPage({
  params,
}: {
  params: Promise<{ locale: string; eventSlug: string }>;
}) {
  const { locale, eventSlug } = await params;
  setRequestLocale(locale);

  const event = await getEventBySlug(eventSlug);
  if (!event) notFound();

  const [nights, artists] = await Promise.all([listEventNights(event.id), listArtists(event.tenant_id)]);

  // Each night's artists come from its own lineup rows, in billing order.
  // This used to print the first two artists of the whole tenant under every
  // night, so all nine nights claimed the same headliners.
  const nightsWithArtists = await Promise.all(
    nights.map(async (night) => {
      const lineup = (await listLineupForNight(night.id)).sort((a, b) => a.billing - b.billing);
      return {
        night,
        artists: lineup
          .map((l) => artists.find((a) => a.id === l.artist_id))
          .filter((a): a is NonNullable<typeof a> => Boolean(a)),
      };
    })
  );

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4 gap-1">
        <Link href={`/e/${eventSlug}`}>
          <ChevronLeft className="h-4 w-4" />
          Back to event
        </Link>
      </Button>

      <h1 className="font-display text-2xl font-bold text-foreground">Full lineup</h1>
      <p className="mt-1 text-muted-foreground">{event.title}</p>

      <div className="mt-8 space-y-4">
        {nightsWithArtists.map(({ night, artists: nightArtists }) => (
          <Link
            key={night.id}
            href={`/e/${eventSlug}/night/${night.night_number}`}
            className="group block rounded-xl border border-border bg-surface p-5 transition-all hover:border-primary/50 hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <NightCard
                nightNumber={night.night_number}
                date={formatDate(night.date, locale)}
                themeName={night.theme ?? `Night ${night.night_number}`}
                dresscode={night.dress_code ?? undefined}
                accentColor={night.theme_color ?? undefined}
                className="hidden shrink-0 sm:flex"
              />
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-bold text-foreground group-hover:text-primary">
                  Night {night.night_number} — {night.theme ?? `Night ${night.night_number}`}
                </h2>
                <p className="text-sm text-muted-foreground">{formatDate(night.date, locale)}</p>
                {night.dress_code && (
                  <span className="mt-2 inline-block rounded-full border border-border px-2.5 py-0.5 text-xs">
                    Dress code: {night.dress_code}
                  </span>
                )}
                <div className="mt-4">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <Music className="h-3 w-3" /> Performing
                  </p>
                  {nightArtists.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">Artists to be announced</p>
                  ) : (
                    <p className="mt-2 text-sm text-foreground">
                      {nightArtists.map((a, i) => (
                        <span key={a.id}>
                          {i > 0 && <span className="text-muted-foreground"> · </span>}
                          <span className={i === 0 ? "font-semibold" : ""}>{a.name}</span>
                        </span>
                      ))}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
