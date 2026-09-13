import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@manhar-garba/ui";
import { getEventBySlug, listEventNights, getEventContent } from "@manhar-garba/mock-data";
import { ChevronLeft, Camera } from "lucide-react";
import { NightArt } from "@/components/event/night-art";

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string; eventSlug: string }>;
}) {
  const { locale, eventSlug } = await params;
  setRequestLocale(locale);

  const event = await getEventBySlug(eventSlug);
  if (!event) notFound();

  const [nights, content] = await Promise.all([listEventNights(event.id), getEventContent(event.id)]);
  const captions = content?.galleryCaptions ?? [];

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4 gap-1">
        <Link href={`/e/${eventSlug}`}>
          <ChevronLeft className="h-4 w-4" />
          Back to event
        </Link>
      </Button>

      <h1 className="font-display text-2xl font-bold text-foreground">Gallery</h1>
      <p className="mt-1 text-sm text-muted-foreground">{event.title}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {nights.map((night, i) => (
          <Link
            key={night.id}
            href={`/e/${eventSlug}/night/${night.night_number}`}
            className="group relative aspect-square overflow-hidden rounded-xl border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <NightArt
              color={night.theme_color}
              nightNumber={night.night_number}
              className="h-full w-full transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
                Night {night.night_number} · {night.theme}
              </p>
              <p className="text-sm font-medium text-white">{captions[i] ?? night.theme}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex items-start justify-center gap-2 text-center text-sm text-muted-foreground">
        <Camera className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Illustrated previews of each night&rsquo;s theme. Photos from the event go up here after each night.</p>
      </div>
    </div>
  );
}
