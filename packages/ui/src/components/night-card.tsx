import * as React from "react";
import Image from "next/image";
import { cn } from "../lib/utils";

interface NightCardProps {
  nightNumber: number;
  date: string;
  themeName: string;
  dresscode?: string;
  headlineArtist?: string;
  imageUrl?: string;
  accentColor?: string;
  /**
   * Adds the hover and focus affordance for a card that is wrapped in a link.
   * Without it a card that navigates looks exactly like one that doesn't, and
   * people stop trying to click anything.
   */
  interactive?: boolean;
  className?: string;
}

export function NightCard({
  nightNumber,
  date,
  themeName,
  dresscode,
  headlineArtist,
  imageUrl,
  accentColor = "hsl(var(--primary))",
  interactive = false,
  className,
}: NightCardProps) {
  return (
    <div
      className={cn(
        "relative flex h-48 w-36 shrink-0 flex-col overflow-hidden rounded-xl border border-border",
        "bg-surface-raised",
        interactive &&
          "cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background",
        className
      )}
    >
      {/* duotone photo or gradient background */}
      {imageUrl ? (
        <div className="absolute inset-0">
          <Image src={imageUrl} alt={themeName} fill className="object-cover" sizes="144px" />
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(180deg, ${accentColor}55 0%, ${accentColor}cc 100%)`, mixBlendMode: "multiply" }}
          />
        </div>
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${accentColor}22 0%, ${accentColor}55 100%)` }}
        />
      )}

      {/* night number top-left */}
      <div className="relative z-10 p-2.5">
        <span
          className="text-4xl font-black leading-none tabular-nums"
          style={{ color: accentColor, WebkitTextStroke: `1px ${accentColor}` }}
        >
          {nightNumber}
        </span>
      </div>

      {/* bottom info */}
      <div className="relative z-10 mt-auto p-2.5">
        <p className="text-xs font-semibold text-white">{date}</p>
        <p className="truncate text-sm font-bold text-white">{themeName}</p>
        {dresscode && (
          <span className="mt-1 inline-block rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {dresscode}
          </span>
        )}
        {headlineArtist && <p className="mt-0.5 truncate text-[10px] text-white/70">{headlineArtist}</p>}
      </div>
    </div>
  );
}

