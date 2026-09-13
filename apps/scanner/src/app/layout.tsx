import type { Metadata, Viewport } from "next";
import { inter, jetbrains } from "@manhar-garba/ui";
import { ThemeProvider, themeScript, Toaster } from "@manhar-garba/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "ManharEvent Scanner",
  description: "Gate scanner PWA — scan passes, offline-first",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/brand/manharevent-favicon-32.png", sizes: "32x32", type: "image/png" }],
    // iOS ignores SVG touch icons, which left a blank square on the home screen.
    apple: [{ url: "/brand/manharevent-icon-square-192.png", sizes: "192x192" }],
  },
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
