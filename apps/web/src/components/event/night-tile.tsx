import { cn } from "@manhar-garba/ui";
import { NightArt } from "./night-art";
import { readableOn, scrimLuminance } from "@/lib/contrast";

/**
 * A night tile that stays readable whatever colour the night's theme is.
 *
 * The shared `NightCard` in packages/ui paints the night number and labels in
 * the theme colour directly on a tint of that same colour, so Night 1 ("White
 * Night") was white-on-white and Nights 8 (Silver) and 9 (gold) were close
 * behind. This is the web app's own tile: the generative `NightArt` carries the
 * colour, a fixed black scrim carries the text, and every label colour is run
 * through `readableOn` against that scrim's worst-case luminance, so the whole
 * set clears WCAG AA no matter what the organizer picked.
 */

// The two scrim strengths below are the only backgrounds text sits on here, so
// their worst case (scrim over pure-white artwork) is what contrast is solved
// against.
const NUMBER_SCRIM = scrimLuminance(0.6);
const INFO_SCRIM = scrimLuminance(0.85);

export interface NightTileProps {
  nightNumber: number;
  date: string;
  themeName: string;
  dressCode?: string | null;
  headlineArtist?: string | null;
  accentColor?: string | null;
  /** Hover/focus affordance for a tile wrapped in a link. */
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE: Record<NonNullable<NightTileProps["size"]>, string> = {
  sm: "aspect-[3/4] text-sm",
  md: "aspect-[3/4] text-sm",
  lg: "aspect-[3/4] text-base",
};

export function NightTile({
  nightNumber,
  date,
  themeName,
  dressCode,
  headlineArtist,
  accentColor,
  interactive = false,
  size = "md",
  className,
}: NightTileProps) {
  const numberInk = readableOn(accentColor, NUMBER_SCRIM);
  const themeInk = readableOn(accentColor, INFO_SCRIM);

  return (
    <div
      className={cn(
        "relative isolate flex w-full flex-col justify-end overflow-hidden rounded-2xl border border-border/70",
        SIZE[size],
        interactive &&
          "transition duration-200 group-hover:-translate-y-1 group-hover:border-primary/60 group-hover:shadow-xl group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background",
        className
      )}
    >
      <NightArt
        color={accentColor ?? null}
        nightNumber={nightNumber}
        className="absolute inset-0 -z-10 h-full w-full"
      />
      {/* Readability scrim: strong at the caption, light at the top so the art shows. */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/70 to-black/20"
        aria-hidden="true"
      />

      {/* Night number — on its own scrim chip so its colour has a known background. */}
      <span
        className="absolute left-2.5 top-2.5 rounded-xl bg-black/60 px-2 py-0.5 font-display text-2xl font-black leading-tight tabular-nums backdrop-blur-[2px] sm:text-3xl"
        style={{ color: numberInk }}
      >
        {nightNumber}
      </span>

      <div className="relative p-3">
        <span
          className="mb-2 block h-0.5 w-7 rounded-full"
          style={{ backgroundColor: themeInk }}
          aria-hidden="true"
        />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">{date}</p>
        <p className="truncate font-semibold leading-snug" style={{ color: themeInk }}>
          {themeName}
        </p>
        {dressCode && (
          <span className="mt-1.5 inline-block rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white ring-1 ring-inset ring-white/25">
            {dressCode}
          </span>
        )}
        {headlineArtist && (
          <p className="mt-1 truncate text-[11px] text-white/80">{headlineArtist}</p>
        )}
      </div>
    </div>
  );
}
