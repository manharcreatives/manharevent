"use client";

/**
 * Last-resort boundary: catches errors thrown by the locale layout itself, so
 * it renders its own <html>/<body> (nothing above it exists at this point).
 * Deliberately dependency-free — no i18n, no design-system imports, inline
 * styles only — because whatever broke may have been one of those.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
          <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>Something broke on our side</h1>
          <p style={{ fontSize: 14, color: "#5c5c5c", margin: "0 0 20px", lineHeight: 1.6 }}>
            No payment was taken. Reload the page — if it keeps happening, your passes are still
            safe under My Passes.
          </p>
          {error.digest && (
            <p style={{ fontSize: 12, color: "#8a8a8a", fontFamily: "monospace" }}>
              Reference: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: 8,
              minHeight: 44,
              padding: "0 20px",
              borderRadius: 10,
              border: 0,
              background: "#e2481c",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
