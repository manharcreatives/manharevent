"use client";

import * as React from "react";
import { Check, X, AlertTriangle, Flag } from "lucide-react";
import { cn } from "../lib/utils";

type ScanState =
  | "allowed"
  | "allowed_partial"
  | "already_in"
  | "wrong_zone"
  | "wrong_night"
  | "refunded"
  | "blocked"
  | "invalid";

interface ScanResultProps {
  state: ScanState;
  primaryText: string;
  secondaryText?: string;
  holderPhotoUrl?: string;
  onDismiss?: () => void;
  className?: string;
}

const STATE_CONFIG: Record<
  ScanState,
  { bg: string; icon: React.ReactNode; autoDismiss: boolean }
> = {
  allowed: {
    bg: "bg-success",
    icon: <Check strokeWidth={3} className="h-24 w-24 text-white" aria-hidden />,
    autoDismiss: true,
  },
  allowed_partial: {
    bg: "bg-success",
    icon: <Check strokeWidth={3} className="h-24 w-24 text-white" aria-hidden />,
    autoDismiss: true,
  },
  already_in: {
    bg: "bg-warning",
    icon: <AlertTriangle strokeWidth={3} className="h-24 w-24 text-black" aria-hidden />,
    autoDismiss: false,
  },
  wrong_zone: {
    bg: "bg-destructive",
    icon: <X strokeWidth={3} className="h-24 w-24 text-white" aria-hidden />,
    autoDismiss: false,
  },
  wrong_night: {
    bg: "bg-destructive",
    icon: <X strokeWidth={3} className="h-24 w-24 text-white" aria-hidden />,
    autoDismiss: false,
  },
  refunded: {
    bg: "bg-destructive",
    icon: <X strokeWidth={3} className="h-24 w-24 text-white" aria-hidden />,
    autoDismiss: false,
  },
  blocked: {
    bg: "bg-destructive",
    icon: <Flag strokeWidth={3} className="h-24 w-24 text-white" aria-hidden />,
    autoDismiss: false,
  },
  invalid: {
    bg: "bg-destructive",
    icon: <X strokeWidth={3} className="h-24 w-24 text-white" aria-hidden />,
    autoDismiss: false,
  },
};

export function ScanResult({ state, primaryText, secondaryText, holderPhotoUrl, onDismiss, className }: ScanResultProps) {
  const config = STATE_CONFIG[state];
  const isWarning = state === "already_in";

  React.useEffect(() => {
    if (config.autoDismiss && onDismiss) {
      const t = setTimeout(onDismiss, 1500);
      return () => clearTimeout(t);
    }
  }, [config.autoDismiss, onDismiss]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 px-6 text-center",
        config.bg,
        className
      )}
      role="status"
      aria-live="assertive"
      onClick={!config.autoDismiss ? onDismiss : undefined}
    >
      {holderPhotoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={holderPhotoUrl}
          alt="Holder photo"
          className="h-[120px] w-[120px] rounded-full object-cover ring-4 ring-white/30"
        />
      )}

      {config.icon}

      <p
        className={cn(
          "text-[2rem] font-black leading-tight tracking-tight",
          isWarning ? "text-black" : "text-white"
        )}
      >
        {primaryText}
      </p>

      {secondaryText && (
        <p className={cn("text-lg font-semibold", isWarning ? "text-black/80" : "text-white/80")}>
          {secondaryText}
        </p>
      )}

      {!config.autoDismiss && (
        <p className={cn("mt-6 text-sm", isWarning ? "text-black/60" : "text-white/60")}>
          Tap anywhere to dismiss
        </p>
      )}
    </div>
  );
}

