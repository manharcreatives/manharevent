// Server component — injects CSS variable overrides for white-label theming.
// Accepts a mock { primary, accent } object in the frontend-first track;
// in production this will receive tenant_branding from Supabase.

interface BrandColors {
  primary?: string; // hex e.g. "#E85D04"
  accent?: string;  // hex e.g. "#9D4EDD"
}

function hexToHsl(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  const r = parseInt(result[1] ?? "0", 16) / 255;
  const g = parseInt(result[2] ?? "0", 16) / 255;
  const b = parseInt(result[3] ?? "0", 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return `0 0% ${Math.round(l * 100)}%`;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function BrandOverride({ primary, accent }: BrandColors) {
  const overrides: string[] = [];
  if (primary) {
    const hsl = hexToHsl(primary);
    if (hsl) overrides.push(`--primary:${hsl};`);
  }
  if (accent) {
    const hsl = hexToHsl(accent);
    if (hsl) overrides.push(`--accent:${hsl};`);
  }
  if (overrides.length === 0) return null;
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root{${overrides.join("")}}`,
      }}
    />
  );
}
