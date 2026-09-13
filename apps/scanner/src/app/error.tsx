"use client";

import { useEffect } from "react";
import { RotateCw } from "lucide-react";

// Deliberately not the shared <ErrorState>: at a gate, the recovery action has
// to be a thumb-sized block, and the queued scans in IndexedDB survive this —
// saying so out loud is what stops staff from panicking and waving people in.
export default function ScannerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive">
        <RotateCw className="h-9 w-9 text-white" />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground">Scanner stopped</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Scans already queued on this phone are safe and will still sync.
        </p>
      </div>
      <button
        onClick={reset}
        className="flex h-20 w-full max-w-sm items-center justify-center gap-3 rounded-2xl bg-primary text-xl font-bold text-primary-foreground active:scale-[0.98]"
      >
        <RotateCw className="h-7 w-7" />
        Restart scanner
      </button>
    </div>
  );
}
