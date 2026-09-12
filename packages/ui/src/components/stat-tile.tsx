import * as React from "react";
import { cn } from "../lib/utils";

interface StatTileProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

export function StatTile({ label, value, sub, trend, className, ...props }: StatTileProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-lg border border-border bg-surface p-4",
        className
      )}
      {...props}
    >
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-2xl font-bold text-foreground tabular-nums">{value}</span>
      {sub && (
        <span
          className={cn(
            "text-xs",
            trend === "up" && "text-success",
            trend === "down" && "text-destructive",
            trend === "neutral" && "text-muted-foreground",
            !trend && "text-muted-foreground"
          )}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

