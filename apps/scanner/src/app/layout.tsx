import type { Metadata, Viewport } from "next";
import { inter, jetbrains } from "@manhar-garba/ui";
import { Toaster } from "@manhar-garba/ui";
import { ServiceWorkerManager } from "@/components/scanner/ServiceWorkerManager";
import "./globals.css";

export const metadata: Metadata = {
  title: "ManharEvent Scanner",
  description: "Gate scanner PWA — scan passes, offline-first",
  manifest: "/manifest.json",
  // A gate tool has no public audience and its URLs leak the event's structure.
  // Belt and braces with the X-Robots-Tag header in next.config.ts.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
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
  // Notched phones held in one hand at a gate: keep the controls out of the chin.
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      // The scanner is locked to dark and does not follow the OS. It is used
      // outdoors after sunset; a light theme is a flashbulb in the guard's face
      // and burns battery on the OLED phones these actually run on. Locking it
      // here also removes the inline theme script, which is one less inline
      // <script> standing between this app and an enforceable CSP.
      data-theme="dark"
      style={{ colorScheme: "dark" }}
      className={`${inter.variable} ${jetbrains.variable}`}
    >
      <body className="bg-background text-foreground font-sans antialiased overscroll-none">
        <noscript>
          <div
            style={{
              minHeight: "100dvh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              padding: "1.5rem",
              textAlign: "center",
            }}
          >
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
              Turn on JavaScript to scan
            </h1>
            <p style={{ maxWidth: "28rem", lineHeight: 1.6 }}>
              The gate scanner validates passes on this phone, with no network. That
              needs JavaScript switched on in your browser settings.
            </p>
            <p style={{ fontSize: "0.875rem", opacity: 0.7 }}>
              If you cannot turn it on, check passes at the help desk instead of
              waving people through.
            </p>
          </div>
        </noscript>
        {children}
        <ServiceWorkerManager />
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
