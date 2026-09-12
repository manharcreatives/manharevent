"use client";

import { useDashboardStore } from "@/lib/dashboard-store";
import { EventCard, PassCard, Button } from "@manhar-garba/ui";
import { useState } from "react";
import { paise } from "@manhar-garba/domain";
import { AlertTriangle } from "lucide-react";

function contrastRatio(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const sRGB = (c: number) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  const lum = 0.2126 * sRGB(r) + 0.7152 * sRGB(g) + 0.0722 * sRGB(b);
  const white = 1;
  return (white + 0.05) / (lum + 0.05);
}

function wcagAA(hex: string) {
  try { return contrastRatio(hex) >= 4.5; } catch { return true; }
}

export default function BrandingPage() {
  const { branding, updateBranding } = useDashboardStore();
  const [primary, setPrimary] = useState(branding.primaryColor);
  const [accent, setAccent] = useState(branding.accentColor);

  const primaryOk = wcagAA(primary);
  const accentOk = wcagAA(accent);

  function handleSave() {
    updateBranding({ primaryColor: primary, accentColor: accent });
    // Inject CSS variables for live preview within this tab
    document.documentElement.style.setProperty("--primary-override", primary);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Branding</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Controls */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Primary colour</label>
              <div className="flex items-center gap-3">
                <input
                  type="color" value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                  className="h-10 w-16 cursor-pointer rounded border border-border bg-transparent p-0.5"
                />
                <input
                  type="text" value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                  className="flex-1 rounded-md border border-border bg-surface-raised px-3 py-2 font-mono text-sm text-foreground"
                />
              </div>
              {!primaryOk && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-warning">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Fails WCAG AA contrast against white background
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Accent colour</label>
              <div className="flex items-center gap-3">
                <input
                  type="color" value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="h-10 w-16 cursor-pointer rounded border border-border bg-transparent p-0.5"
                />
                <input
                  type="text" value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="flex-1 rounded-md border border-border bg-surface-raised px-3 py-2 font-mono text-sm text-foreground"
                />
              </div>
              {!accentOk && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-warning">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Fails WCAG AA contrast against white background
                </p>
              )}
            </div>

            <Button onClick={handleSave} className="w-full" style={{ backgroundColor: primary, borderColor: primary }}>
              Save & preview
            </Button>
          </div>
        </div>

        {/* Live preview */}
        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Live preview</p>
          <div
            className="rounded-xl border border-border bg-surface p-4 space-y-4"
            style={{ "--primary": primary, "--accent": accent } as React.CSSProperties}
          >
            <EventCard
              title="Manhar Navratri 2026"
              city="Ahmedabad"
              dateRange="2 Oct – 10 Oct 2026"
              priceFromPaise={paise(49900)}
              href="#"
            />
            <PassCard
              state="valid"
              holderName="Rina & Kaushik"
              zoneName="Gold Zone"
              zoneColor={accent}
              admits={2}
              nightRange="All 9 nights"
              passCode="PASS-7F3K-9021"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
