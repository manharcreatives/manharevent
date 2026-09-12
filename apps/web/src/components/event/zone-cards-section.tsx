import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button, Money } from "@manhar-garba/ui";
import type { Zone } from "@manhar-garba/domain";
import { paise } from "@manhar-garba/domain";

const ZONE_PRICES: Record<string, number> = {
  VIP: paise(299900),
  GOLD: paise(149900),
  GENERAL: paise(49900),
};

const ZONE_DESCRIPTIONS: Record<string, string> = {
  VIP: "Exclusive front zone with premium view, dedicated lounge, and complimentary parking.",
  GOLD: "Premium standing zone with unobstructed stage view and fast-track entry.",
  GENERAL: "Open standing zone. Dress code strictly enforced at gate.",
};

interface ZoneCardsSectionProps {
  zones: Zone[];
  eventSlug: string;
}

export async function ZoneCardsSection({ zones, eventSlug }: ZoneCardsSectionProps) {
  const t = await getTranslations("Event");

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {zones.map((zone) => {
        const pricePaise = ZONE_PRICES[zone.code] ?? paise(49900);
        const description = ZONE_DESCRIPTIONS[zone.code] ?? zone.description ?? "";
        return (
          <div
            key={zone.id}
            className="flex flex-col rounded-xl border border-border bg-surface p-4"
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
            <p className="mt-1 flex-1 text-xs text-muted-foreground">{description}</p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t("priceFrom", { price: "" })}</p>
                <p className="font-bold text-foreground">
                  <Money paise={pricePaise} />
                </p>
              </div>
              <Button asChild size="sm">
                <Link href={`/e/${eventSlug}/book`}>{t("bookPasses")}</Link>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
