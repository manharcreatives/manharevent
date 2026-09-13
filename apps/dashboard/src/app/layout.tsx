import type { Metadata } from "next";
import { inter, bricolage, jetbrains } from "@manhar-garba/ui";
import { ThemeProvider, themeScript, Toaster } from "@manhar-garba/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "ManharEvent — Dashboard",
  description: "Organizer dashboard",
  icons: {
    icon: [{ url: "/brand/manharevent-favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/brand/manharevent-icon-square-192.png", sizes: "192x192" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${bricolage.variable} ${jetbrains.variable}`}
    >
      <head>
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
