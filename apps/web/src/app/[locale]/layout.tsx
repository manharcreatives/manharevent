import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import {
  inter,
  bricolage,
  jetbrains,
  notoGujarati,
  notoDevanagari,
  ThemeProvider,
  themeScript,
  Toaster,
} from "@manhar-garba/ui";
import { getTenantBySlug } from "@manhar-garba/mock-data";
import { routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { BASE_URL, localeAlternates } from "@/lib/seo";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// This site is the ORGANIZER's own domain (2026-09-12 pivot) — the default
// title/description are this organizer's brand, not "ManharEvent" (which only
// appears as the "Powered by" footer credit).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const [tenant, t] = await Promise.all([
    getTenantBySlug("manhar"),
    getTranslations({ locale, namespace: "Meta" }),
  ]);
  const name = tenant?.display_name ?? "ManharEvent";
  const title = t("siteTitle", { name });
  const description = t("siteDescription");

  return {
    metadataBase: new URL(BASE_URL),
    title: { default: title, template: `%s | ${name}` },
    description,
    applicationName: name,
    alternates: localeAlternates("/", locale),
    openGraph: {
      type: "website",
      siteName: name,
      title,
      description,
      locale: locale === "gu" ? "gu_IN" : locale === "hi" ? "hi_IN" : "en_IN",
      url: BASE_URL,
      images: [{ url: "/brand/manharevent-lockup-light-1600.png", width: 1600, height: 900, alt: name }],
    },
    twitter: { card: "summary_large_image", title, description },
    icons: {
      icon: [{ url: "/brand/manharevent-favicon-32.png", sizes: "32x32", type: "image/png" }],
      apple: [{ url: "/brand/manharevent-icon-square-192.png", sizes: "192x192" }],
    },
    manifest: "/manifest.webmanifest",
    formatDetection: { telephone: false },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const [messages, t] = await Promise.all([
    getMessages(),
    getTranslations({ locale, namespace: "Common" }),
  ]);

  // Only ship the Indic webfont the visitor's locale actually needs.
  const script = locale === "gu" ? notoGujarati.variable : locale === "hi" ? notoDevanagari.variable : "";

  return (
    <html
      lang={locale}
      dir="ltr"
      suppressHydrationWarning
      className={`${inter.variable} ${bricolage.variable} ${jetbrains.variable} ${script}`.trim()}
    >
      <head>
        {/* Blocks FODT (flash of default theme) — must run before first paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-background text-foreground font-sans antialiased">
        <ThemeProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[100] focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-white"
            >
              {t("skipToContent")}
            </a>
            <SiteHeader />
            {/* The footer carries the bottom padding that clears the fixed mobile
                nav — doing it here as well just inserted 80px of dead space
                between the last section and the footer on every page. */}
            <main id="main-content" className="min-h-[60vh]">
              {children}
            </main>
            <SiteFooter />
            <MobileBottomNav />
            <Toaster />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
