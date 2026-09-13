import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button, Money } from "@manhar-garba/ui";
import type { Zone } from "@manhar-garba/domain";
import { getZoneFromPrice, listPassTypesForZone } from "@manhar-garba/mock-data";
import { Users, ArrowRight } from "lucide-react";

interface ZoneCardsSectionProps {
  zones: Zone[];
  eventId: string;
  eventSlug: string;
}

/**
 * Zone chooser on the event page.
 *
 * The "from ₹X" figures used to be a hardcoded lookup keyed on zone code,
 * which meant the price here and the price at checkout came from two
 * different places. They now come from the zone's real price tiers, so an
 * organizer editing a tier moves this number too.
 */
export async function ZoneCardsSection({ zones, eventId, eventSlug }: ZoneCardsSectionProps) {
  const t = await getTranslations("Event");

  const cards = await Promise.all(
    zones.map(async (zone) => ({
      zone,
      fromPaise: await getZoneFromPrice(eventId, zone.id),
      passTypes: await listPassTypesForZone(eventId, zone.id),
    }))
  );

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ zone, fromPaise, passTypes }) => {
        const onSale = passTypes.filter((pt) => pt.status === "on_sale");
        const maxAdmits = onSale.reduce((max, pt) => Math.max(max, pt.admits), 0);
        const soldOut = fromPaise === null || onSale.length === 0;

        return (
          <Link
            key={zone.id}
            href={soldOut ? `/e/${eventSlug}` : `/e/${eventSlug}/book`}
            aria-disabled={soldOut}
            className={
              soldOut
                ? "pointer-events-none flex flex-col rounded-xl border border-border bg-surface p-4 opacity-60"
                : "group flex flex-col rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            }
          >
            <div className="flex items-center justify-between">
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white"
                style={{ backgroundColor: zone.color ?? "hsl(var(--primary))" }}
              >
                {zone.code}
              </span>
              <span className="text-xs text-muted-foreground">
                {zone.capacity.toLocaleString("en-IN")} capacity
              </span>
            </div>

            <p className="mt-2 font-semibold text-foreground">{zone.name}</p>
            <p className="mt-1 flex-1 text-xs text-muted-foreground">{zone.description}</p>

            {maxAdmits > 1 && (
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                Solo, couple and family passes — one pass admits up to {maxAdmits}
              </p>
            )}

            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t("priceFrom", { price: "" })}</p>
                <p className="font-bold text-foreground">
                  {fromPaise !== null ? <Money paise={fromPaise} /> : "—"}
                </p>
              </div>
              {soldOut ? (
                <span className="text-xs font-medium text-muted-foreground">Not on sale</span>
              ) : (
                <Button size="sm" tabIndex={-1} className="pointer-events-none">
                  {t("bookPasses")}
                  <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Button>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
