"use client";

import { useEffect } from "react";
import { RotateCw, LayoutDashboard } from "lucide-react";
import { Button } from "@manhar-garba/ui";

export default function DashboardError({
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
        This screen failed to load
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Your event, sales, and check-in data are unaffected — only this view failed to render.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-xs text-placeholder">Reference: {error.digest}</p>
      )}
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={reset}>
          <RotateCw className="mr-2 h-4 w-4" />
          Reload this screen
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            // Full document load, not a client transition: the boundary tripped
            // because some client state is bad, and only a fresh load clears it.
            window.location.href = "/dashboard";
          }}
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard home
        </Button>
      </div>
    </div>
  );
}
