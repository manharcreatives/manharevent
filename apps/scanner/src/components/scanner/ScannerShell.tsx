import { ScanLine } from "lucide-react";

/**
 * The first thing a gate phone paints, and the only thing it paints until the
 * JS bundle has run.
 *
 * Every scanner screen is a client component reading IndexedDB, so the server
 * had nothing to send but an empty spinner — on a cheap Android on venue wifi
 * that is several seconds of white nothing on the one device in the product that
 * is supposed to work with no network at all. This is real markup, rendered on
 * the server, shaped like the screen that replaces it, so the chrome does not
 * jump when hydration lands.
 */
export function ScannerShell({
  title = "Starting gate scanner",
  subtitle = "Reading tonight's pass list from this phone",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Identity bar placeholder — same height as <GateIdentityBar> */}
      <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
        <div className="h-4 w-4 shrink-0 rounded-full bg-surface-raised" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="h-3 w-28 rounded bg-surface-raised" />
          <div className="h-2.5 w-40 rounded bg-surface-raised/70" />
        </div>
      </div>

      {/* Status bar placeholder */}
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
        <div className="h-2.5 w-16 rounded bg-surface-raised" />
        <div className="h-2.5 w-20 rounded bg-surface-raised/70" />
        <div className="h-2.5 w-12 rounded bg-surface-raised/70" />
      </div>

      {/* Viewfinder placeholder, with the words that make the wait make sense */}
      <div className="relative flex flex-1 flex-col items-center justify-center gap-5 bg-surface-sunken px-6 text-center">
        <div className="relative h-40 w-40">
          <span className="absolute left-0 top-0 h-8 w-8 border-l-4 border-t-4 border-muted-foreground/40" />
          <span className="absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4 border-muted-foreground/40" />
          <span className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-muted-foreground/40" />
          <span className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-muted-foreground/40" />
          <ScanLine
            className="absolute inset-0 m-auto h-12 w-12 animate-pulse text-muted-foreground/60"
            aria-hidden
          />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <p className="text-xs text-muted-foreground/70">
          Works with no network — nothing here waits on a server
        </p>
      </div>

      {/* Bottom controls placeholder */}
      <div className="flex items-center justify-between gap-3 border-t border-border/40 px-4 py-3">
        <div className="h-11 w-11 rounded-xl bg-surface-raised" />
        <div className="h-11 w-40 rounded-full bg-surface-raised" />
        <div className="h-11 w-11 rounded-xl bg-surface-raised" />
      </div>
    </div>
  );
}
