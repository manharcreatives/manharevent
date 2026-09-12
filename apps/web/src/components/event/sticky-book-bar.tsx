import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button, Money } from "@manhar-garba/ui";

interface StickyBookBarProps {
  eventSlug: string;
  pricePaise: number;
}

export async function StickyBookBar({ eventSlug, pricePaise }: StickyBookBarProps) {
  const t = await getTranslations("Event");

  return (
    <div className="fixed inset-x-0 bottom-14 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{t("priceFrom", { price: "" })}</p>
          <p className="text-base font-bold text-foreground">
            <Money paise={pricePaise} />
          </p>
        </div>
        <Button asChild className="flex-1">
          <Link href={`/e/${eventSlug}/book`}>{t("bookPasses")}</Link>
        </Button>
      </div>
    </div>
  );
}
