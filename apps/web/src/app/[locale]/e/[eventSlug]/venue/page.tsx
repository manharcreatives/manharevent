import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@manhar-garba/ui";
import { getEventBySlug, getVenue, getEventContent, listGates } from "@manhar-garba/mock-data";
import { ChevronLeft, MapPin, Navigation, DoorOpen } from "lucide-react";

export default async function VenuePage({
  params,
}: {
  params: Promise<{ locale: string; eventSlug: string }>;
}) {
  const { locale, eventSlug } = await params;
  setRequestLocale(locale);

  const event = await getEventBySlug(eventSlug);
  if (!event) notFound();

  const [venue, content, gates] = await Promise.all([
    event.venue_id ? getVenue(event.venue_id) : Promise.resolve(null),
    getEventContent(event.id),
    listGates(event.id),
  ]);

  const hasCoords = venue?.lat != null && venue?.lng != null;
  const directionsUrl = venue
    ? venue.google_maps_url ??
      (hasCoords
        ? `https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name}, ${venue.city}`)}`)
    : null;

  // OpenStreetMap's embed needs no API key, so the map works in the demo and
  // in production alike. This replaces a grey box that literally read
  // "[Map embed — 23.0225, 72.5714]".
  const d = 0.006;
  const mapSrc = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${venue!.lng! - d}%2C${venue!.lat! - d}%2C${venue!.lng! + d}%2C${venue!.lat! + d}&layer=mapnik&marker=${venue!.lat}%2C${venue!.lng}`
    : null;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4 gap-1">
        <Link href={`/e/${eventSlug}`}>
          <ChevronLeft className="h-4 w-4" />
          Back to event
        </Link>
      </Button>

      <h1 className="font-display text-2xl font-bold text-foreground">Venue</h1>

      {venue ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-border bg-surface p-6">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-foreground">{venue.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[venue.address, venue.city, venue.state].filter(Boolean).join(", ")}
                    {venue.pincode ? ` – ${venue.pincode}` : ""}
                  </p>
                </div>
              </div>
              {directionsUrl && (
                <Button asChild className="mt-5 w-full gap-2">
                  <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                    <Navigation className="h-4 w-4" />
                    Get directions
                  </a>
                </Button>
              )}
            </div>

            {content && content.howToReach.length > 0 && (
              <div className="rounded-xl border border-border bg-surface p-6">
                <h2 className="font-semibold text-foreground">How to reach</h2>
                <dl className="mt-3 space-y-2.5 text-sm">
                  {content.howToReach.map((r) => (
                    <div key={r.mode} className="flex gap-3">
                      <dt className="w-24 shrink-0 font-medium text-foreground">{r.mode}</dt>
                      <dd className="text-muted-foreground">{r.detail}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {gates.length > 0 && (
              <div className="rounded-xl border border-border bg-surface p-6">
                <h2 className="font-semibold text-foreground">Gates</h2>
                <p className="mt-1 text-xs text-muted-foreground">Enter by the gate for the zone on your pass.</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {gates.map((g) => (
                    <li key={g.id} className="flex items-center gap-2 text-foreground">
                      <DoorOpen className="h-4 w-4 text-muted-foreground" />
                      {g.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-surface lg:col-span-3">
            {mapSrc ? (
              <iframe
                title={`Map of ${venue.name}`}
                src={mapSrc}
                className="h-80 w-full lg:h-full lg:min-h-[480px]"
                loading="lazy"
              />
            ) : (
              <div className="flex h-80 items-center justify-center p-6 text-center text-sm text-muted-foreground">
                The organizer hasn&rsquo;t pinned the venue on a map yet — use Get directions.
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-6 text-muted-foreground">Venue details will be announced soon.</p>
      )}
    </div>
  );
}
