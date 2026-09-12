"use client";

// "use client" — active route highlighting requires browser pathname
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Compass, Ticket, Wallet, User } from "lucide-react";
import { cn } from "@manhar-garba/ui";

const NAV_ITEMS = [
  { href: "/" as const, labelKey: "explore" as const, Icon: Compass },
  { href: "/me/passes" as const, labelKey: "myPasses" as const, Icon: Ticket },
  { href: "/me/wallet" as const, labelKey: "wallet" as const, Icon: Wallet },
  { href: "/me" as const, labelKey: "account" as const, Icon: User },
] as const;

export function MobileBottomNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background/95 backdrop-blur-md md:hidden"
      aria-label="Mobile navigation"
    >
      {NAV_ITEMS.map(({ href, labelKey, Icon }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
              "min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{t(labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
