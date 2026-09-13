"use client";

import { useEffect } from "react";
import { RotateCw, Home } from "lucide-react";
import { Button } from "@manhar-garba/ui";

export default function MarketingError({
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
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/30">
        <RotateCw className="h-7 w-7 text-destructive" />
      </div>
      <h1 className="mt-5 font-display text-2xl font-bold text-foreground">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Nothing you submitted was lost. Try again, or write to us and we&rsquo;ll finish your
        registration by hand.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-xs text-placeholder">Reference: {error.digest}</p>
      )}
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={reset}>
          <RotateCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            // Full document load, not a client transition: the boundary tripped
            // because some client state is bad, and only a fresh load clears it.
            window.location.href = "/";
          }}
        >
          <Home className="mr-2 h-4 w-4" />
          Go to home
        </Button>
      </div>
    </div>
  );
}
