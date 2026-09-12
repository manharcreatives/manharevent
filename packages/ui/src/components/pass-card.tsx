import * as React from "react";
import Image from "next/image";
import { cn } from "../lib/utils";
import { CopyableCode } from "./copyable-code";

type PassState = "valid" | "used-tonight" | "refunded" | "transferred-away";

interface PassCardProps {
  state?: PassState;
  holderName: string;
  zoneName: string;
  zoneColor?: string;
  admits: number;
  nightRange: string;
  passCode: string;
  nightBadge?: string;
  imageUrl?: string;
  checkedInAt?: string;
  refundedOn?: string;
  className?: string;
}

export function PassCard({
  state = "valid",
  holderName,
  zoneName,
  zoneColor,
  admits,
  nightRange,
  passCode,
  nightBadge,
  imageUrl,
  checkedInAt,
  className,
}: PassCardProps) {
  const isDisabled = state === "refunded" || state === "transferred-away";
  const isUsed = state === "used-tonight";

  return (
    <div
      className={cn(
        "relative w-full max-w-sm overflow-hidden rounded-xl border border-border bg-surface",
        isDisabled && "opacity-70",
        className
      )}
    >
      {/* header row */}
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="font-display text-xs font-bold uppercase tracking-widest text-primary">Manharevents</span>
        {nightBadge && (
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {nightBadge}
          </span>
        )}
      </div>

      {/* duotone photo panel */}
      <div className={cn("relative mx-4 mt-3 h-36 overflow-hidden rounded-lg bg-surface-raised", isUsed && "grayscale")}>
        {imageUrl ? (
          <Image src={imageUrl} alt="" fill className="object-cover" sizes="320px" />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: zoneColor
                ? `linear-gradient(135deg, ${zoneColor}33 0%, ${zoneColor}88 100%)`
                : "linear-gradient(135deg, hsl(var(--primary)/0.2) 0%, hsl(var(--primary)/0.5) 100%)",
            }}
          />
        )}
        {/* refunded watermark */}
        {state === "refunded" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="rotate-[-25deg] text-3xl font-black uppercase tracking-widest text-destructive opacity-80"
              style={{ WebkitTextStroke: "1px hsl(var(--destructive))" }}
            >
              Refunded
            </span>
          </div>
        )}
        {/* used-tonight strip */}
        {isUsed && checkedInAt && (
          <div className="absolute inset-x-0 bottom-0 bg-warning/90 py-1 text-center text-xs font-semibold text-black">
            Checked in {checkedInAt}
          </div>
        )}
      </div>

      {/* pass details */}
      <div className="px-4 py-3">
        <p className="text-xl font-bold text-foreground">{holderName}</p>
        <div className="mt-1 flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: zoneColor ?? "hsl(var(--primary))" }}
          >
            {zoneName}
          </span>
          <span className="text-xs text-muted-foreground">Admits {admits}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{nightRange}</p>
      </div>

      {/* QR placeholder */}
      {!isDisabled && (
        <div className="mx-4 mb-2 flex h-24 items-center justify-center rounded border border-border bg-white">
          <span className="text-xs text-muted-foreground">[QR code]</span>
        </div>
      )}

      {/* pass code */}
      <div className="px-4 pb-4">
        <CopyableCode value={passCode} />
      </div>

      {/* transferred-away overlay */}
      {state === "transferred-away" && (
        <div className="absolute inset-0 flex items-end justify-center bg-background/60 pb-8">
          <p className="text-sm text-muted-foreground">Transferred to another holder</p>
        </div>
      )}
    </div>
  );
}

