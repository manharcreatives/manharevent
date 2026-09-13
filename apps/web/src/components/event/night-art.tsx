/**
 * Generated artwork for a Garba night, used wherever a photo would go until
 * the organizer uploads real ones. Built from the night's own theme colour so
 * each tile is distinct — the gallery used to be nine identical grey boxes
 * with an image icon, which reads as "broken" rather than "coming soon".
 *
 * Pure SVG, server-rendered, no network.
 */
export function NightArt({
  color,
  nightNumber,
  className,
}: {
  color: string | null;
  nightNumber: number;
  className?: string;
}) {
  const base = color ?? "#F55B2A";
  const id = `night-art-${nightNumber}`;
  // Dandiya-circle motif: rings of dancers around a central lamp.
  const rings = [0.34, 0.24, 0.14];
  const dotsPerRing = [18, 12, 8];

  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={`${id}-bg`} cx="50%" cy="55%" r="75%">
          <stop offset="0%" stopColor={base} stopOpacity="0.95" />
          <stop offset="60%" stopColor={base} stopOpacity="0.45" />
          <stop offset="100%" stopColor="#0e0e12" />
        </radialGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff7d6" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffb347" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#${id}-bg)`} />
      <rect width="200" height="200" fill="#000" opacity="0.18" />
      {rings.map((r, ri) =>
        Array.from({ length: dotsPerRing[ri]! }).map((_, i) => {
          const angle = (i / dotsPerRing[ri]!) * Math.PI * 2 + ri * 0.3 + nightNumber * 0.2;
          const cx = 100 + Math.cos(angle) * r * 200;
          const cy = 110 + Math.sin(angle) * r * 140;
          return <circle key={`${ri}-${i}`} cx={cx} cy={cy} r={3.2 - ri * 0.6} fill="#fff" opacity={0.75 - ri * 0.15} />;
        })
      )}
      <circle cx="100" cy="110" r="26" fill={`url(#${id}-glow)`} />
      <circle cx="100" cy="110" r="4" fill="#fff7d6" />
    </svg>
  );
}
