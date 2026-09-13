import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { inter, bricolage, jetbrains, notoGujarati, notoDevanagari } from "@manhar-garba/ui";
import { ThemeProvider, themeScript } from "@manhar-garba/ui";
import { Toaster } from "@manhar-garba/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ManharEvent — Garba & Navratri ticketing for organizers", template: "%s | ManharEvent" },
  description: "Register your Navratri event and get your own ticketed website, admin panel, and offline gate scanner — powered by Manhar Creatives.",
  icons: {
    icon: [{ url: "/brand/manharevent-favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/brand/manharevent-icon-square-192.png", sizes: "192x192" }],
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://manharevent.com"),
};

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
