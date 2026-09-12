import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@manhar-garba/ui";
import { getEventBySlug } from "@manhar-garba/mock-data";
import { ChevronLeft, Image as ImageIcon } from "lucide-react";

const GALLERY_PLACEHOLDERS = Array.from({ length: 9 }, (_, i) => i + 1);

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string; eventSlug: string }>;
}) {
  const { locale, eventSlug } = await params;
  setRequestLocale(locale);

  const event = await getEventBySlug(eventSlug);
  if (!event) notFound();

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

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {GALLERY_PLACEHOLDERS.map((n) => (
          <button
            key={n}
            className="aspect-square overflow-hidden rounded-lg bg-surface-raised transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label={`Gallery photo ${n}`}
          >
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground/40" aria-hidden="true" />
            </div>
          </button>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Photos from last year&apos;s event. This year&apos;s gallery will appear after the first night.
      </p>
    </div>
  );
}
