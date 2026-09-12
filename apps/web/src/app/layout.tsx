import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { inter, bricolage, jetbrains, notoGujarati, notoDevanagari } from "@manhar-garba/ui";
import { ThemeProvider, themeScript } from "@manhar-garba/ui";
import { Toaster } from "@manhar-garba/ui";
import { getTenantBySlug } from "@manhar-garba/mock-data";
import "./globals.css";

// This site is the ORGANIZER's own domain (2026-09-12 pivot) — the default
// title/description are this organizer's brand, not "ManharEvent" (which
// only appears as the "Powered by" footer credit). Dynamic because the
// organizer's name comes from tenant data, not a hardcoded string.
export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantBySlug("manhar");
  const name = tenant?.display_name ?? "ManharEvent";
  return {
    title: { default: name, template: `%s | ${name}` },
    description: "Garba & Navratri ticketing — nine nights, one pass.",
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://manharevent.com"),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const isGu = locale === "gu";
  const isHi = locale === "hi";

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${inter.variable} ${bricolage.variable} ${jetbrains.variable} ${isGu ? notoGujarati.variable : ""} ${isHi ? notoDevanagari.variable : ""}`.trim()}
    >
      <head>
        {/* Blocks FODT (flash of default theme) — must run before first paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-background text-foreground font-sans antialiased">
        <ThemeProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-white"
          >
            Skip to content
          </a>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
