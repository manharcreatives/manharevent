/**
 * The hero's background.
 *
 * There is no event photography and none is coming, so the presence has to be
 * drawn. This is a rangoli read from above: petal arcs on a 16-fold rotation,
 * concentric dotted rings standing in for a dandiya circle, and two warm pools
 * of light. Everything is painted from theme tokens at low alpha, so it reads
 * as a warm haze in the light theme and as a lit floor in the dark one,
 * without a single hardcoded colour.
 */
const PETALS = 16;
const RING_DOTS = [
  { r: 300, count: 48, size: 2.2, alpha: 0.22 },
  { r: 232, count: 36, size: 2.6, alpha: 0.3 },
  { r: 168, count: 24, size: 3, alpha: 0.36 },
];

export function HeroBackdrop({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      {/* Two pools of warm light, the same trick a Garba ground's floodlights play. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 72% 28%, hsl(var(--primary) / 0.28) 0%, transparent 62%), radial-gradient(ellipse 60% 55% at 18% 82%, hsl(var(--accent) / 0.22) 0%, transparent 58%)",
        }}
      />
      <svg
        viewBox="0 0 800 700"
        className="absolute left-1/2 top-1/2 h-[125%] w-[125%] -translate-x-1/2 -translate-y-1/2"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <defs>
          <radialGradient id="hero-fade" cx="50%" cy="46%" r="52%">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="70%" stopColor="#fff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id="hero-mask">
            <rect width="800" height="700" fill="url(#hero-fade)" />
          </mask>
        </defs>

        <g mask="url(#hero-mask)">
          {/* Petal arcs — the rangoli itself. */}
          {Array.from({ length: PETALS }).map((_, i) => (
            <ellipse
              key={`petal-${i}`}
              cx={400}
              cy={230}
              rx={34}
              ry={196}
              fill="none"
              stroke="hsl(var(--primary) / 0.16)"
              strokeWidth={1.1}
              transform={`rotate(${(i * 360) / PETALS} 400 326)`}
            />
          ))}

          {/* Dandiya circles: dancers as dots, wider rings further out. */}
          {RING_DOTS.map((ring) =>
            Array.from({ length: ring.count }).map((_, i) => {
              const angle = (i / ring.count) * Math.PI * 2;
              return (
                <circle
                  key={`ring-${ring.r}-${i}`}
                  cx={400 + Math.cos(angle) * ring.r}
                  cy={326 + Math.sin(angle) * ring.r * 0.62}
                  r={ring.size}
                  fill={`hsl(var(--accent) / ${ring.alpha})`}
                />
              );
            })
          )}

          <circle cx={400} cy={326} r={104} fill="none" stroke="hsl(var(--primary) / 0.22)" strokeWidth={1.2} />
          <circle cx={400} cy={326} r={132} fill="none" stroke="hsl(var(--primary) / 0.12)" strokeWidth={1} />
        </g>
      </svg>
    </div>
  );
}
