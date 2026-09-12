import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@manhar-garba/ui";
import { getEventBySlug, getVenue } from "@manhar-garba/mock-data";
import { ChevronLeft, MapPin } from "lucide-react";

export default async function VenuePage({
  params,
}: {
  params: Promise<{ locale: string; eventSlug: string }>;
}) {
  const { locale, eventSlug } = await params;
  setRequestLocale(locale);

  const event = await getEventBySlug(eventSlug);
  if (!event) notFound();

  const venue = event.venue_id ? await getVenue(event.venue_id) : null;

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
        <div className="mt-6 space-y-6">
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-semibold text-foreground">{venue.name}</p>
                {venue.address && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {venue.address}, {venue.city}, {venue.state} – {venue.pincode}
                  </p>
                )}
                {venue.google_maps_url && (
                  <a
                    href={venue.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm text-primary hover:underline"
                  >
                    Open in Google Maps →
                  </a>
                )}
              </div>
            </div>

            <div className="mt-6 flex h-64 items-center justify-center rounded-xl bg-surface-raised">
              <p className="text-xs text-muted-foreground">[Map embed — {venue.lat}, {venue.lng}]</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="font-semibold text-foreground">How to reach</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>🚌 <strong>Bus:</strong> AMTS routes 28, 32, 45 stop near the venue</li>
              <li>🛺 <strong>Auto/Cab:</strong> Search &ldquo;{venue.name}&rdquo; on Google Maps</li>
              <li>🚗 <strong>Parking:</strong> Venue parking available (₹100 per vehicle). Outside parking on Ring Road.</li>
            </ul>
          </div>
        </div>
      ) : (
        <p className="mt-6 text-muted-foreground">Venue details will be announced soon.</p>
      )}
    </div>
  );
}
