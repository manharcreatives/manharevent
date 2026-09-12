"use client";

// "use client" — locale switching requires browser router APIs
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LangSwitcher } from "@manhar-garba/ui";

type LangCode = "en" | "gu" | "hi";

export function LocaleSwitcher() {
  const locale = useLocale() as LangCode;
  const pathname = usePathname();
  const router = useRouter();

  function handleChange(lang: LangCode) {
    router.replace(pathname, { locale: lang });
  }

  return <LangSwitcher value={locale} onChange={handleChange} />;
}
