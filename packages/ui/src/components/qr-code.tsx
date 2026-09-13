"use client";

import * as React from "react";
import QRCode from "qrcode";
import { cn } from "../lib/utils";

export interface QrCodeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** What the scanner will read. */
  value: string;
  /** Rendered pixel size of the square. */
  size?: number;
  /** Caption under the code — a pass code, a URL. */
  caption?: string;
  /**
   * Error-correction level. `M` is the default; `H` survives more damage and
   * is worth it for a pass someone will fold into a pocket all evening.
   */
  level?: "L" | "M" | "Q" | "H";
}

/**
 * A real, scannable QR code.
 *
 * Always drawn dark-on-white regardless of theme: phone cameras need the
 * light quiet zone, and an inverted code in dark mode reads as a black square
 * to most scanners. So the white plate is deliberate, not an oversight.
 */
export function QrCode({
  value,
  size = 192,
  caption,
  level = "M",
  className,
  ...props
}: QrCodeProps) {
  const [dataUrl, setDataUrl] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      errorCorrectionLevel: level,
      margin: 2,
      width: size * 2, // 2× so it stays sharp on a retina screen and when printed
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size, level]);

  return (
    <div className={cn("flex flex-col items-center", className)} {...props}>
      <div
        className="rounded-xl bg-white p-2 shadow-md"
        style={{ width: size + 16, height: size + 16 }}
      >
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- a data: URL, nothing for the image optimizer to do
          <img
            src={dataUrl}
            alt={caption ? `QR code for ${caption}` : "QR code"}
            width={size}
            height={size}
            className="h-full w-full"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center rounded-lg bg-neutral-100 text-xs text-neutral-500"
            role="status"
          >
            {failed ? "QR unavailable" : ""}
          </div>
        )}
      </div>
      {caption && (
        <p className="mt-2 font-mono text-sm font-bold tracking-wide text-foreground">{caption}</p>
      )}
    </div>
  );
}

/** Saves the same code as a PNG — for a poster, a WhatsApp forward, or print. */
export function QrDownloadButton({
  value,
  filename = "qr-code.png",
  className,
  children,
}: {
  value: string;
  filename?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [busy, setBusy] = React.useState(false);

  async function download() {
    setBusy(true);
    try {
      const url = await QRCode.toDataURL(value, {
        errorCorrectionLevel: "H",
        margin: 3,
        width: 1024, // print-usable without being asked twice
        color: { dark: "#000000", light: "#ffffff" },
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button onClick={download} disabled={busy} className={className}>
      {children}
    </button>
  );
}
