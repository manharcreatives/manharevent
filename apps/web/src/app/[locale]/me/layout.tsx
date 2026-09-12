import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const ME_NAV = [
  { href: "/me/passes", label: "My Passes" },
  { href: "/me/orders", label: "Orders" },
  { href: "/me/wallet", label: "Wallet" },
  { href: "/me/refunds", label: "Refunds" },
];

export default async function MeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
      <nav className="mb-6 flex gap-2 overflow-x-auto border-b border-border pb-0">
        {ME_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 border-b-2 border-transparent px-4 pb-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[active]:border-primary data-[active]:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
