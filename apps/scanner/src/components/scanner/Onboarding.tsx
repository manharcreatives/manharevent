"use client";

import { useState } from "react";
import { ChevronRight, Check, X, AlertTriangle } from "lucide-react";

interface Props {
  onDone: () => void;
}

const SCREENS = [
  {
    icon: "📱",
    title: "How to scan",
    body: "Point the camera at the QR code on a pass — it scans continuously, no button needed. Hold steady, 20–30 cm away. If the camera fails, tap the 123 button to enter the code manually.",
    bgClass: "bg-surface",
  },
  {
    icon: null,
    title: "What the colours mean",
    body: null,
    bgClass: "bg-surface",
    custom: "colours",
  },
  {
    icon: "🔴",
    title: "What to do on red",
    body: "Do NOT let the person through. Tap the screen to dismiss, then politely ask them to step aside. Call your supervisor for blocked passes (CALL SUPERVISOR). Every denial is logged automatically.",
    bgClass: "bg-surface",
  },
] as const;

function ColoursScreen() {
  const states = [
    { bg: "bg-success", icon: <Check className="h-8 w-8 text-white" />, label: "Green — ADMITTED", detail: "Let them in" },
    { bg: "bg-warning", icon: <AlertTriangle className="h-8 w-8 text-black" />, label: "Amber — ALREADY INSIDE", detail: "Tap to dismiss, wave them away" },
    { bg: "bg-destructive", icon: <X className="h-8 w-8 text-white" />, label: "Red — DENIED", detail: "Do not allow entry, tap to dismiss" },
  ];
  return (
    <div className="space-y-3 mt-2">
      {states.map((s) => (
        <div key={s.label} className={`flex items-center gap-4 rounded-xl p-4 ${s.bg}`}>
          <div className="shrink-0">{s.icon}</div>
          <div>
            <p className="font-bold text-base" style={{ color: s.bg === "bg-warning" ? "black" : "white" }}>{s.label}</p>
            <p className="text-sm" style={{ color: s.bg === "bg-warning" ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.8)" }}>{s.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Onboarding({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const screen = SCREENS[step];
  if (!screen) return null;

  function next() {
    if (step < SCREENS.length - 1) {
      setStep((s) => s + 1);
    } else {
      onDone();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-8 pb-4">
        {SCREENS.map((_, i) => (
          <span
            key={i}
            className={`h-2 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-2 bg-border"}`}
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col px-6 pb-8">
        <div className="flex-1 overflow-y-auto">
          {screen.icon && (
            <div className="text-6xl mb-4 text-center">{screen.icon}</div>
          )}
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">{screen.title}</h1>
          {screen.body && (
            <p className="text-base text-muted-foreground leading-relaxed">{screen.body}</p>
          )}
          {"custom" in screen && screen.custom === "colours" && <ColoursScreen />}
        </div>

        <div className="mt-6 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="rounded-xl border border-border px-6 py-4 text-sm font-medium text-muted-foreground"
            >
              Back
            </button>
          )}
          <button
            onClick={next}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-bold text-white active:bg-primary/90"
          >
            {step < SCREENS.length - 1 ? (
              <>Next <ChevronRight className="h-5 w-5" /></>
            ) : (
              <>Start scanning <Check className="h-5 w-5" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
