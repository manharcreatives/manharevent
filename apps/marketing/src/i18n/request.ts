import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

const messageLoaders = {
  en: () => import("@manhar-garba/i18n/messages/en.json"),
  gu: () => import("@manhar-garba/i18n/messages/gu.json"),
  hi: () => import("@manhar-garba/i18n/messages/hi.json"),
} as const;

type Locale = keyof typeof messageLoaders;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  const loader = messageLoaders[locale as Locale] ?? messageLoaders.en;
  const messages = (await loader()).default;

  return { locale, messages };
});
