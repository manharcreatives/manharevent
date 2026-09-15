import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  getEventBySlug,
  getTenantBySlug,
  listZones,
  listPassTypes,
  listPriceTiers,
  listAddons,
  listEventNights,
} from "@manhar-garba/mock-data";
import { BookClient, type BookZone, type BookPassType, type BookAddon, type BookNight } from "@/components/book/book-client";
import { localeAlternates } from "@/lib/seo";
import { currentPricePaise } from "@/lib/pricing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; eventSlug: string }>;
}): Promise<Metadata> {
  const { locale, eventSlug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Book" });
  const event = await getEventBySlug(eventSlug);
  return {
    title: t("title"),
    description: event?.title,
    alternates: localeAlternates(`/e/${eventSlug}/book`, locale),
  };
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ locale: string; eventSlug: string }>;
}) {
  const { locale, eventSlug } = await params;
  setRequestLocale(locale);

  const event = await getEventBySlug(eventSlug);
  if (!event) notFound();

  const tenant = await getTenantBySlug("manhar");
  const [zones, passTypes, addons, nights] = await Promise.all([
    listZones(event.id),
    listPassTypes(event.id),
    listAddons(event.id),
    listEventNights(event.id),
  ]);

  const tierLists = await Promise.all(passTypes.map((pt) => listPriceTiers(pt.id)));

  const bookZones: BookZone[] = zones.map((z) => ({
    id: z.id,
    code: z.code,
    name: z.name,
    description: z.description,
    color: z.color,
    capacity: z.capacity,
  }));

  const bookPassTypes: BookPassType[] = passTypes.map((pt, i) => {
    const available = Math.max(0, pt.total_quantity - pt.sold_quantity - pt.held_quantity);
    return {
      id: pt.id,
      zoneId: pt.zone_id,
      name: pt.name,
      description: pt.description,
      kind: pt.kind,
      admits: pt.admits,
      nightIds: pt.night_ids,
      pricePaise: currentPricePaise(tierLists[i] ?? []) ?? 0,
      minPerOrder: pt.min_per_order,
      maxPerOrder: pt.max_per_order,
      available,
    };
  });

  const bookAddons: BookAddon[] = addons.map((a) => ({
    id: a.id,
    name: a.name,
    pricePaise: a.price_paise,
  }));

  const bookNights: BookNight[] = nights
    .map((n) => ({ id: n.id, nightNumber: n.night_number, date: n.date, theme: n.theme }))
    .sort((a, b) => a.nightNumber - b.nightNumber);

  return (
    <BookClient
      eventSlug={event.slug}
      eventId={event.id}
      eventTitle={event.title}
      tenantId={tenant?.id ?? event.tenant_id}
      zones={bookZones}
      passTypes={bookPassTypes}
      addons={bookAddons}
      nights={bookNights}
    />
  );
}
