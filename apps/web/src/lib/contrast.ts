/**
 * Contrast helpers for colours that come from *data*, not from the theme.
 *
 * Night themes and zones carry organizer-chosen hex colours (White Night is
 * literally #FFFFFF, Silver Night #C0C0C0, the finale gold). Painting label
 * text in that colour — which is what the shared NightCard does — makes three
 * of the nine nights invisible. Everything here exists so a label can keep the
 * night's identity colour while still clearing WCAG AA (4.5:1) against the
 * surface it actually lands on.
 */

function channelToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1]!;
  if (h.length === 3) h = h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function toHex([r, g, b]: [number, number, number]): string {
  return "#" + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");
}

/** WCAG relative luminance of an sRGB triple. */
export function luminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(channelToLinear) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(l1: number, l2: number): number {
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Luminance of a black scrim at `alpha` composited over the worst case
 * background — pure white. Any real artwork under the scrim is darker than
 * that, so a colour that passes here passes everywhere.
 */
export function scrimLuminance(alpha: number): number {
  const v = (1 - alpha) * 255;
  return luminance([v, v, v]);
}

/**
 * Returns `hex` if it already clears `target` against a background of
 * luminance `bgLum`, otherwise the same hue mixed toward white (on dark
 * backgrounds) or toward black (on light ones) until it does. Hue survives;
 * the contrast failure doesn't.
 */
export function readableOn(hex: string | null | undefined, bgLum: number, target = 4.5): string {
  const rgb = hex ? parseHex(hex) : null;
  if (!rgb) return bgLum < 0.18 ? "#ffffff" : "#0b0b10";
  if (ratio(luminance(rgb), bgLum) >= target) return toHex(rgb);

  const towardsWhite = bgLum < 0.18;
  const goal: [number, number, number] = towardsWhite ? [255, 255, 255] : [0, 0, 0];
  for (let step = 1; step <= 20; step++) {
    const t = step / 20;
    const mixed: [number, number, number] = [
      rgb[0] + (goal[0] - rgb[0]) * t,
      rgb[1] + (goal[1] - rgb[1]) * t,
      rgb[2] + (goal[2] - rgb[2]) * t,
    ];
    if (ratio(luminance(mixed), bgLum) >= target) return toHex(mixed);
  }
  return towardsWhite ? "#ffffff" : "#0b0b10";
}

/** Ink to use on top of a solid fill of `hex` — the zone badges rely on this. */
export function inkOn(hex: string | null | undefined): string {
  const rgb = hex ? parseHex(hex) : null;
  if (!rgb) return "#ffffff";
  return luminance(rgb) > 0.42 ? "#14131a" : "#ffffff";
}
