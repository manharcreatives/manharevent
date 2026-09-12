import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@manhar-garba/ui";
import { getEventBySlug, listEventNights, listArtists } from "@manhar-garba/mock-data";
import { NightCard } from "@manhar-garba/ui";
import { ChevronLeft } from "lucide-react";

export default async function LineupPage({
  params,
}: {
  params: Promise<{ locale: string; eventSlug: string }>;
}) {
  const { locale, eventSlug } = await params;
  setRequestLocale(locale);

  const event = await getEventBySlug(eventSlug);
  if (!event) notFound();

  const [nights, artists] = await Promise.all([
    listEventNights(event.id),
    listArtists(event.tenant_id),
  ]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4 gap-1">
        <Link href={`/e/${eventSlug}`}>
          <ChevronLeft className="h-4 w-4" />
          Back to event
        </Link>
      </Button>

      <h1 className="font-display text-2xl font-bold text-foreground">Full Lineup</h1>
      <p className="mt-1 text-muted-foreground">{event.title}</p>

      <div className="mt-8 space-y-8">
        {nights.map((night) => (
          <div key={night.id} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-start gap-4">
              <NightCard
                nightNumber={night.night_number}
                date={night.date}
                themeName={night.theme ?? `Night ${night.night_number}`}
                dresscode={night.dress_code ?? undefined}
                accentColor={night.theme_color ?? undefined}
                className="shrink-0"
              />
              <div className="flex-1">
                <h2 className="font-display text-lg font-bold text-foreground">
                  Night {night.night_number} — {night.theme ?? `Night ${night.night_number}`}
                </h2>
                <p className="text-sm text-muted-foreground">{night.date}</p>
                {night.dress_code && (
                  <span className="mt-2 inline-block rounded-full border border-border px-2.5 py-0.5 text-xs">
                    Dress code: {night.dress_code}
                  </span>
                )}
                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Artists</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {artists.slice(0, 2).map((artist) => (
                      <Link
                        key={artist.id}
                        href={`/artist/${artist.slug}`}
                        className="rounded-full border border-border bg-surface-raised px-3 py-1 text-sm hover:border-primary hover:text-primary"
                      >
                        {artist.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
