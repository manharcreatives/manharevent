import Link from "next/link";
import type { Metadata } from "next";
import { WifiOff, ScanLine, Keyboard } from "lucide-react";

export const metadata: Metadata = {
  title: "Offline — ManharEvent Scanner",
  robots: { index: false, follow: false },
};

/**
 * What the service worker serves when a navigation cannot be satisfied from the
 * cache. The message matters: a guard who sees a browser error page assumes the
 * scanner is dead and starts waving people through. This says the opposite, and
 * it is true — validation and the queue are entirely local.
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background px-6 py-10 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-warning/15">
        <WifiOff className="h-9 w-9 text-warning" aria-hidden />
      </div>

      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">No signal right now</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Keep scanning. Passes are checked against the list already on this phone
          and every scan is saved here — they upload by themselves the moment the
          network comes back.
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <Link
          href="/scan"
          className="flex h-20 items-center justify-center gap-3 rounded-2xl bg-primary text-xl font-bold text-primary-foreground active:scale-[0.98]"
        >
          <ScanLine className="h-7 w-7" aria-hidden />
          Back to scanner
        </Link>
        <Link
          href="/scan/manual"
          className="flex h-16 items-center justify-center gap-2 rounded-2xl border border-border text-sm font-semibold text-foreground active:bg-surface-raised"
        >
          <Keyboard className="h-5 w-5" aria-hidden />
          Type a code instead
        </Link>
      </div>
    </div>
  );
}
