"use client";

interface Zone {
  name: string;
  color: string;
  current: number;
  capacity: number;
}

interface Props {
  zones: Zone[];
}

export function LiveOccupancyMeter({ zones }: Props) {
  return (
    <div className="space-y-3">
      {zones.map((z) => {
        const pct = Math.min(100, Math.round((z.current / z.capacity) * 100));
        const warning = pct >= 80;
        return (
          <div key={z.name}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-medium text-foreground">{z.name}</span>
              <span className={warning ? "text-warning" : "text-muted-foreground"}>
                {z.current.toLocaleString("en-IN")} / {z.capacity.toLocaleString("en-IN")} ({pct}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-raised">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: warning ? "hsl(38 95% 55%)" : z.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
