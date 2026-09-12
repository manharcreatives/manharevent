import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button, NightCard } from "@manhar-garba/ui";
import { getEventBySlug, listEventNights } from "@manhar-garba/mock-data";
import { ChevronLeft } from "lucide-react";

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
          date={night.date}
          themeName={night.theme ?? `Night ${night.night_number}`}
          dresscode={night.dress_code ?? undefined}
          accentColor={night.theme_color ?? undefined}
          className="h-64 w-48 shrink-0"
        />

        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Night {night.night_number}
          </h1>
          {night.theme && (
            <p className="mt-1 text-xl text-muted-foreground">{night.theme}</p>
          )}

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-muted-foreground">Date</dt>
              <dd className="text-foreground">{night.date}</dd>
            </div>
            {night.gates_open_at && (
              <div className="flex gap-3">
                <dt className="w-28 shrink-0 text-muted-foreground">Gates open</dt>
                <dd className="text-foreground">
                  {new Date(night.gates_open_at).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Kolkata",
                  })}
                </dd>
              </div>
            )}
            {night.dress_code && (
              <div className="flex gap-3">
                <dt className="w-28 shrink-0 text-muted-foreground">Dress code</dt>
                <dd className="text-foreground">{night.dress_code}</dd>
              </div>
            )}
          </dl>

          <Button asChild className="mt-8">
            <Link href={`/e/${eventSlug}/book`}>Book passes for this night →</Link>
          </Button>
        </div>
      </div>

      {/* SEO: Other nights */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-bold text-foreground">Other nights</h2>
        <div className="-mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {nights
            .filter((ni) => ni.id !== night.id)
            .map((ni) => (
              <Link key={ni.id} href={`/e/${eventSlug}/night/${ni.night_number}`}>
                <NightCard
                  nightNumber={ni.night_number}
                  date={ni.date}
                  themeName={ni.theme ?? `Night ${ni.night_number}`}
                  dresscode={ni.dress_code ?? undefined}
                  accentColor={ni.theme_color ?? undefined}
                />
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
