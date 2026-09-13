import Link from "next/link";

/**
 * Root-level 404 for paths the next-intl middleware could not map to a locale.
 * Lives outside `[locale]`, so it renders its own document shell.
 * `[locale]/not-found.tsx` is the localised one inside the site chrome.
 */
export const metadata = { title: "Page not found" };

export default function RootNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#faf9f7",
          color: "#1a1a1a",
          padding: "24px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <p style={{ fontSize: 56, fontWeight: 700, margin: 0, color: "#e2481c" }}>404</p>
          <h1 style={{ fontSize: 22, margin: "4px 0 8px" }}>Page not found</h1>
          <p style={{ fontSize: 14, color: "#5c5c5c", margin: "0 0 20px", lineHeight: 1.6 }}>
            That link doesn&rsquo;t exist on ManharEvent. If you were mid-registration, your
            application is saved — start again from the home page.
          </p>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: 44,
              padding: "0 20px",
              borderRadius: 10,
              background: "#e2481c",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Go to home
          </Link>
        </div>
      </body>
    </html>
  );
}
