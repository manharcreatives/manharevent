"use client";

// "use client" — locale switching requires browser router APIs
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LangSwitcher } from "@manhar-garba/ui";

type LangCode = "en" | "gu" | "hi";

export function LocaleSwitcher() {
  const locale = useLocale() as LangCode;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("MarketingNav");

  function handleChange(lang: LangCode) {
    router.replace(pathname, { locale: lang });
  }

  return (
    // LangSwitcher's own buttons are ~29x24 — under the 44px minimum on a
    // phone, and this is the control a Gujarati-first audience reaches for
    // first. Pad its children from here rather than forking the component.
    <div role="group" aria-label={t("language")}>
      <LangSwitcher
        value={locale}
        onChange={handleChange}
        className="[&>button]:min-h-11 [&>button]:min-w-11 [&>button]:text-sm"
      />
    </div>
  );
}
