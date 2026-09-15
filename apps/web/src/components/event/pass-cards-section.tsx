import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button, Money } from "@manhar-garba/ui";
import { listPassTypes, listPriceTiers } from "@manhar-garba/mock-data";
import { currentPricePaise } from "@/lib/pricing";
import { Users, Moon, ArrowRight } from "lucide-react";

interface PassCardsSectionProps {
  eventId: string;
  eventSlug: string;
}

/**
 * Open-ground events (zones.length <= 1 — most Garba grounds, one general
 * ticket, no VIP/Gold split) show passes directly instead of a zone chooser.
 * `ZoneCardsSection` stays exactly as it was for the zoned event; this is a
 * separate small component rather than a branch inside it, since the two
 * have almost nothing in common once you take the zone card out.
 */
export async function PassCardsSection({ eventId, eventSlug }: PassCardsSectionProps) {
  const t = await getTranslations("Event");
  const tBook = await getTranslations("Book");

  const passTypes = await listPassTypes(eventId);
  const cards = await Promise.all(
    passTypes
      .filter((pt) => pt.status === "on_sale")
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(async (pt) => ({
        pt,
        pricePaise: currentPricePaise(await listPriceTiers(pt.id)),
        available: Math.max(0, pt.total_quantity - pt.sold_quantity - pt.held_quantity),
      }))
  );

  if (cards.length === 0) return null;

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ pt, pricePaise, available }) => {
        const soldOut = available <= 0 || pricePaise === null;
        return (
          <Link
            key={pt.id}
            href={soldOut ? `/e/${eventSlug}` : `/e/${eventSlug}/book`}
            aria-disabled={soldOut}
            className={
              soldOut
                ? "pointer-events-none flex flex-col rounded-xl border border-border bg-surface p-4 opacity-60"
                : "group flex flex-col rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            }
          >
            <p className="font-semibold text-foreground">{pt.name}</p>
            {pt.description && <p className="mt-1 flex-1 text-xs text-muted-foreground">{pt.description}</p>}

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {tBook("admits", { count: pt.admits })}
              </span>
              <span className="flex items-center gap-1">
                <Moon className="h-3 w-3" />
                {pt.night_ids.length === 1
                  ? tBook("nightsCovered", { count: 1 })
                  : tBook("allNights", { count: pt.night_ids.length })}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t("priceFrom", { price: "" })}</p>
                <p className="font-bold text-foreground">
                  {pricePaise !== null ? <Money paise={pricePaise} /> : "—"}
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
