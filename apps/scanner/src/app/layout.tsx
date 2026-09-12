import type { Metadata, Viewport } from "next";
import { inter, jetbrains } from "@manhar-garba/ui";
import { ThemeProvider, themeScript, Toaster } from "@manhar-garba/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manharevents Scanner",
  description: "Gate scanner PWA — scan passes, offline-first",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Scanner",
  },
};

export const viewport: Viewport = {
  themeColor: "#0E0E12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrains.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="bg-background text-foreground font-sans antialiased overscroll-none">
        <ThemeProvider>
          {children}
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
