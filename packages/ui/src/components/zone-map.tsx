"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface ZoneRegion {
  id: string;
  label: string;
  token: "vip" | "gold" | "general";
  path: string;
  available?: boolean;
}

interface ZoneMapProps {
  zones?: ZoneRegion[];
  selected?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

const ZONE_TOKEN_MAP: Record<ZoneRegion["token"], string> = {
  vip: "hsl(var(--zone-vip))",
  gold: "hsl(var(--zone-gold))",
  general: "hsl(var(--primary))",
};

const DEFAULT_ZONES: ZoneRegion[] = [
  {
    id: "vip",
    label: "VIP",
    token: "vip",
    path: "M 80 40 L 220 40 L 220 120 L 80 120 Z",
    available: true,
  },
  {
    id: "gold",
    label: "Gold",
    token: "gold",
    path: "M 40 130 L 260 130 L 260 220 L 40 220 Z",
    available: true,
  },
  {
    id: "general",
    label: "General",
    token: "general",
    path: "M 20 230 L 280 230 L 280 340 L 20 340 Z",
    available: true,
  },
];

export function ZoneMap({ zones = DEFAULT_ZONES, selected, onSelect, className }: ZoneMapProps) {
  return (
    <div className={cn("relative w-full max-w-xs", className)}>
      <svg viewBox="0 0 300 380" className="w-full" aria-label="Venue zone map" role="img">
        {/* Stage */}
        <rect x="100" y="10" width="100" height="24" rx="4" fill="hsl(var(--surface-raised))" />
        <text x="150" y="27" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
          STAGE
        </text>

        {zones.map((zone) => {
          const color = ZONE_TOKEN_MAP[zone.token] ?? "hsl(var(--primary))";
          const isSelected = selected === zone.id;
          const isAvailable = zone.available !== false;

          return (
            <g key={zone.id}>
              <path
                d={zone.path}
                fill={isSelected ? color : `${color}33`}
                stroke={color}
                strokeWidth={isSelected ? 2.5 : 1.5}
                opacity={isAvailable ? 1 : 0.35}
                className="cursor-pointer transition-all duration-150"
                onClick={() => isAvailable && onSelect?.(zone.id)}
                style={isSelected ? { filter: `drop-shadow(0 0 8px ${color})` } : undefined}
                role="button"
                aria-label={zone.label}
                aria-pressed={isSelected}
                tabIndex={isAvailable ? 0 : -1}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && isAvailable) onSelect?.(zone.id);
                }}
              />
              {/* zone label â€” approximated center */}
              <text
                x={150}
                y={parseFloat(zone.path.split(" ")[2] ?? "0") + (parseFloat(zone.path.split(" ")[9] ?? "0") - parseFloat(zone.path.split(" ")[2] ?? "0")) / 2}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill={isSelected ? "white" : color}
                pointerEvents="none"
              >
                {zone.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

