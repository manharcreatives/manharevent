import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button, Money } from "@manhar-garba/ui";
import type { Zone } from "@manhar-garba/domain";
import { listPassTypesForZone } from "@manhar-garba/mock-data";
import { zoneFromPricePaise } from "@/lib/pricing";
import { inkOn } from "@/lib/contrast";
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
      fromPaise: await zoneFromPricePaise(eventId, zone.id),
      passTypes: await listPassTypesForZone(eventId, zone.id),
    }))
  );

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ zone, fromPaise, passTypes }) => {
        const onSale = passTypes.filter(
          (pt) => pt.status === "on_sale" && pt.total_quantity - pt.sold_quantity - pt.held_quantity > 0
        );
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
                className="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide"
                style={{ backgroundColor: zone.color ?? "hsl(var(--primary))", color: inkOn(zone.color) }}
              >
                {zone.code}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("capacity", { count: zone.capacity.toLocaleString("en-IN") })}
              </span>
            </div>

            <p className="mt-2 font-semibold text-foreground">{zone.name}</p>
            <p className="mt-1 flex-1 text-xs text-muted-foreground">{zone.description}</p>

            {maxAdmits > 1 && (
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {t("multiAdmitHint", { count: maxAdmits })}
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
                <span className="text-xs font-medium text-muted-foreground">{t("soldOut")}</span>
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
