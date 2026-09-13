"use client";

/**
 * Root-level error boundary, for the few routes that live OUTSIDE `[locale]`
 * (the root not-found, and anything thrown by the pass-through root layout).
 * Those routes have no <html> above them — `[locale]/layout.tsx` owns the
 * document now — so this boundary renders its own, exactly like
 * `app/not-found.tsx` does. The localised, in-chrome boundary that visitors
 * normally see is `app/[locale]/error.tsx`.
 */
export default function RootError({
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
          padding: 24,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>Something broke on our side</h1>
          <p style={{ fontSize: 14, color: "#5c5c5c", margin: "0 0 20px", lineHeight: 1.6 }}>
            No payment was taken. Try again — if it keeps happening, your passes are still safe
            under My Passes.
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
