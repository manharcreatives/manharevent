import * as React from "react";
import Image from "next/image";
import { cn } from "../lib/utils";
import { Money } from "./money";

interface EventCardProps {
  title: string;
  city: string;
  dateRange: string;
  priceFromPaise: number;
  imageUrl?: string;
  href?: string;
  className?: string;
}

export function EventCard({ title, city, dateRange, priceFromPaise, imageUrl, href, className }: EventCardProps) {
  const Wrapper = href ? "a" : "div";

  return (
    <Wrapper
      href={href}
      className={cn(
        "group relative block aspect-[4/5] overflow-hidden rounded-lg bg-surface-raised",
        "transition-all duration-300",
        "hover:-translate-y-1 hover:[box-shadow:var(--shadow-glow)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      {imageUrl ? (
        <Image src={imageUrl} alt={title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-surface-raised to-background" />
      )}

      {/* gradient scrim bottom 40% */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }} />

      {/* price chip top-right */}
      <div className="absolute right-2 top-2 rounded-full bg-surface/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
        <Money paise={priceFromPaise} /> onwards
      </div>

      {/* event info bottom-left */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="font-display text-[1.25rem] font-bold leading-tight text-white">{title}</p>
        <p className="mt-0.5 text-xs text-white/70">
          {city} Â· {dateRange}
        </p>
      </div>
    </Wrapper>
  );
}

