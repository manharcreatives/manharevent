import Link from "next/link";
import { ScanLine, Keyboard, ClipboardList } from "lucide-react";

// Gate-staff surface: one enormous target, no prose. Someone is standing at a
// gate at night with a queue behind them — the useful thing is "get me back to
// work", and a second route out in case the camera is what went wrong.
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background px-6 py-10 text-center">
      <div>
        <p className="font-display text-7xl font-bold leading-none text-muted-foreground">404</p>
        <h1 className="mt-4 text-2xl font-bold text-foreground">This screen does not exist</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Nothing is wrong with the scanner. Scans already taken on this phone are
          still saved and will upload on their own.
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

        <div className="flex gap-3">
          <Link
            href="/scan/manual"
            className="flex h-16 flex-1 items-center justify-center gap-2 rounded-2xl border border-border text-sm font-semibold text-foreground active:bg-surface-raised"
          >
            <Keyboard className="h-5 w-5" aria-hidden />
            Type a code
          </Link>
          <Link
            href="/scan/log"
            className="flex h-16 flex-1 items-center justify-center gap-2 rounded-2xl border border-border text-sm font-semibold text-foreground active:bg-surface-raised"
          >
            <ClipboardList className="h-5 w-5" aria-hidden />
            Tonight&apos;s log
          </Link>
        </div>
      </div>
    </div>
  );
}
