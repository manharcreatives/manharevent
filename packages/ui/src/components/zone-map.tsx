"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface ZoneRegion {
  id: string;
  label: string;
  token: "vip" | "gold" | "general";
  /** Region geometry in the map's 300x380 viewBox. */
  x: number;
  y: number;
  width: number;
  height: number;
  available?: boolean;
  /** Optional second line under the label, e.g. "from ₹2,499" or "Sold out". */
  note?: string;
}

interface ZoneMapProps {
  zones?: ZoneRegion[];
  selected?: string;
  onSelect?: (id: string) => void;
  className?: string;
  /** Screen-reader name for the whole map. */
  ariaLabel?: string;
}

/**
 * Zone colours come from CSS custom properties that hold bare `H S% L%`
 * triples, so alpha has to go through the `hsl(... / a)` slash form. The
 * previous version built `${color}33` from an already-wrapped `hsl(var(--x))`
 * string — invalid CSS, which SVG resolves to black, so every zone rendered as
 * a solid black rectangle.
 */
const ZONE_HSL: Record<ZoneRegion["token"], string> = {
  vip: "var(--zone-vip)",
  gold: "var(--zone-gold)",
  general: "var(--primary)",
};

const DEFAULT_ZONES: ZoneRegion[] = [
  { id: "vip", label: "VIP", token: "vip", x: 80, y: 46, width: 140, height: 78 },
  { id: "gold", label: "Gold", token: "gold", x: 40, y: 136, width: 220, height: 88 },
  { id: "general", label: "General", token: "general", x: 20, y: 236, width: 260, height: 108 },
];

export function ZoneMap({
  zones = DEFAULT_ZONES,
  selected,
  onSelect,
  className,
  ariaLabel = "Venue zone map",
}: ZoneMapProps) {
  const interactive = typeof onSelect === "function";

  return (
    <div className={cn("relative w-full max-w-xs", className)}>
      <svg
        viewBox="0 0 300 380"
        className="w-full"
        role={interactive ? "group" : "img"}
        aria-label={ariaLabel}
      >
        {/* Stage — the orientation anchor; everything below faces it. */}
        <rect
          x="90"
          y="8"
          width="120"
          height="26"
          rx="6"
          fill="hsl(var(--surface-raised))"
          stroke="hsl(var(--border))"
        />
        <text
          x="150"
          y="26"
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          letterSpacing="1.5"
          fill="hsl(var(--muted-foreground))"
        >
          STAGE
        </text>

        {zones.map((zone) => {
          const hsl = ZONE_HSL[zone.token] ?? ZONE_HSL.general;
          const isSelected = selected === zone.id;
          const isAvailable = zone.available !== false;
          const cx = zone.x + zone.width / 2;
          const cy = zone.y + zone.height / 2;
          const hasNote = Boolean(zone.note);

          const handleActivate = () => {
            if (isAvailable) onSelect?.(zone.id);
          };

          return (
            <g
              key={zone.id}
              role={interactive ? "button" : undefined}
              aria-label={zone.note ? `${zone.label}, ${zone.note}` : zone.label}
              aria-pressed={interactive ? isSelected : undefined}
              aria-disabled={interactive && !isAvailable ? true : undefined}
              tabIndex={interactive && isAvailable ? 0 : undefined}
              onClick={interactive ? handleActivate : undefined}
              onKeyDown={
                interactive
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleActivate();
                      }
                    }
                  : undefined
              }
              className={cn(
                "transition-opacity duration-150 [&:focus-visible]:outline-none",
                interactive && isAvailable && "cursor-pointer",
                interactive && !isAvailable && "cursor-not-allowed"
              )}
              opacity={isAvailable ? 1 : 0.45}
            >
              <rect
                x={zone.x}
                y={zone.y}
                width={zone.width}
                height={zone.height}
                rx="8"
                fill={`hsl(${hsl} / ${isSelected ? 0.28 : 0.12})`}
                stroke={`hsl(${hsl})`}
                strokeWidth={isSelected ? 2.5 : 1.5}
                strokeDasharray={isAvailable ? undefined : "5 4"}
                className="transition-all duration-150"
              />
              {/* Focus ring drawn as its own rect so it is visible on any fill. */}
              {interactive && (
                <rect
                  x={zone.x - 3}
                  y={zone.y - 3}
                  width={zone.width + 6}
                  height={zone.height + 6}
                  rx="11"
                  fill="none"
                  stroke="hsl(var(--ring))"
                  strokeWidth="2"
                  className="opacity-0 [g:focus-visible>&]:opacity-100"
                />
              )}
              <text
                x={cx}
                y={hasNote ? cy - 2 : cy + 4}
                textAnchor="middle"
                fontSize="13"
                fontWeight="700"
                fill="hsl(var(--foreground))"
                pointerEvents="none"
              >
                {zone.label}
              </text>
              {hasNote && (
                <text
                  x={cx}
                  y={cy + 15}
                  textAnchor="middle"
                  fontSize="10.5"
                  fill="hsl(var(--muted-foreground))"
                  pointerEvents="none"
                >
                  {zone.note}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
