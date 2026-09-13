import { inkOn } from "@/lib/contrast";

/**
 * The nine nights as a wheel, coloured by each night's own theme.
 *
 * The hero used to be a headline floating in four hundred pixels of nothing.
 * This fills it with the one fact that actually sells a Navratri pass — that
 * there are nine distinct nights and one pass covers them — drawn from the
 * real night data rather than decoration. Night numbers sit on solid fills, so
 * `inkOn` can pick black or white per segment and every one of them is legible.
 */
export interface HeroWheelNight {
  nightNumber: number;
  themeColor: string | null;
}

const CX = 160;
const CY = 160;
const R_OUTER = 152;
const R_INNER = 104;
const GAP_DEG = 2.6;

function polar(r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)] as const;
}

function segmentPath(startDeg: number, endDeg: number) {
  const [x0, y0] = polar(R_OUTER, startDeg);
  const [x1, y1] = polar(R_OUTER, endDeg);
  const [x2, y2] = polar(R_INNER, endDeg);
  const [x3, y3] = polar(R_INNER, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${R_OUTER} ${R_OUTER} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${R_INNER} ${R_INNER} 0 ${large} 0 ${x3} ${y3} Z`;
}

export function HeroNightWheel({
  nights,
  nightsLabel,
  onePassLabel,
  ariaLabel,
  className,
}: {
  nights: HeroWheelNight[];
  /** e.g. "nights" — sits under the big count in the hub. */
  nightsLabel: string;
  /** e.g. "one pass" — the promise the wheel is making. */
  onePassLabel: string;
  ariaLabel: string;
  className?: string;
}) {
  if (nights.length === 0) return null;
  const step = 360 / nights.length;

  return (
    <div className={className}>
      <div className="relative mx-auto aspect-square w-full max-w-[340px]">
        <svg viewBox="0 0 320 320" className="h-full w-full drop-shadow-[0_18px_40px_hsl(var(--primary)/0.18)]" role="img" aria-label={ariaLabel}>
          <circle cx={CX} cy={CY} r={R_OUTER + 6} fill="hsl(var(--primary) / 0.06)" />
          {nights.map((night, i) => {
            const start = i * step + GAP_DEG / 2;
            const end = (i + 1) * step - GAP_DEG / 2;
            const fill = night.themeColor ?? "hsl(var(--primary))";
            const [lx, ly] = polar((R_OUTER + R_INNER) / 2, (start + end) / 2);
            return (
              <g key={night.nightNumber}>
                <path d={segmentPath(start, end)} fill={fill} stroke="hsl(var(--background))" strokeWidth={1.5} />
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="font-display text-[17px] font-bold"
                  fill={inkOn(night.themeColor)}
                >
                  {night.nightNumber}
                </text>
              </g>
            );
          })}
          <circle cx={CX} cy={CY} r={R_INNER - 8} fill="hsl(var(--surface))" stroke="hsl(var(--border))" strokeWidth={1} />
        </svg>

        {/* The hub is real text, not SVG, so it inherits the display face and scales with the theme. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-5xl font-black leading-none text-foreground">{nights.length}</span>
          <span className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {nightsLabel}
          </span>
          <span className="mt-2 rounded-full bg-primary/12 px-3 py-1 text-[11px] font-semibold text-primary">
            {onePassLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
