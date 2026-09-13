"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Keyboard,
  ScanLine,
  X,
} from "lucide-react";

interface Props {
  onDone: () => void;
}

/**
 * Three screens, read once, in the dark, by someone who was handed this phone a
 * minute ago. Everything is centred and sized for arm's length — the previous
 * version left two-thirds of the screen empty below a paragraph of grey text.
 */
const SCREENS = [
  {
    id: "how",
    icon: <ScanLine className="h-10 w-10 text-primary" aria-hidden />,
    title: "How to scan",
    body: "Point the camera at the QR code on a pass. It reads continuously — there is no button to press. Hold steady, about 20–30 cm away.",
    footnote: (
      <span className="inline-flex items-center gap-1.5">
        <Keyboard className="h-4 w-4" aria-hidden />
        Camera struggling? Tap the keyboard button to type the code instead.
      </span>
    ),
  },
  {
    id: "colours",
    icon: null,
    title: "What the screen tells you",
    body: null,
    footnote: "Every scan is also saved to tonight's log, admitted or not.",
  },
  {
    id: "red",
    icon: <X className="h-10 w-10 text-destructive" aria-hidden />,
    title: "What to do on red",
    body: "Do not let them through. Tap the screen to clear it, then ask them politely to step aside. On CALL SUPERVISOR, hold the pass and call your supervisor.",
    footnote: "You never have to argue — the reason is on screen, show it to them.",
  },
] as const;

function ColoursScreen() {
  // Colour is never the only signal: each row carries its own icon and its own
  // words, because colour-blind door staff exist and so does a cracked screen.
  const states = [
    {
      bg: "bg-success",
      fg: "text-white",
      dim: "text-white/80",
      icon: <Check className="h-7 w-7 text-white" strokeWidth={3} aria-hidden />,
      label: "Green, tick — ADMITTED",
      detail: "Let them in",
    },
    {
      bg: "bg-warning",
      fg: "text-black",
      dim: "text-black/70",
      icon: <AlertTriangle className="h-7 w-7 text-black" strokeWidth={3} aria-hidden />,
      label: "Amber, triangle — ALREADY INSIDE",
      detail: "Tap to clear, do not admit again",
    },
    {
      bg: "bg-destructive",
      fg: "text-white",
      dim: "text-white/80",
      icon: <X className="h-7 w-7 text-white" strokeWidth={3} aria-hidden />,
      label: "Red, cross — DENIED",
      detail: "Do not admit; the reason is under the cross",
    },
  ];

  return (
    <div className="mt-6 space-y-3">
      {states.map((s) => (
        <div key={s.label} className={`flex items-center gap-4 rounded-2xl p-4 ${s.bg}`}>
          <div className="shrink-0">{s.icon}</div>
          <div className="min-w-0">
            <p className={`text-base font-bold ${s.fg}`}>{s.label}</p>
            <p className={`text-sm ${s.dim}`}>{s.detail}</p>
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

  const isLast = step === SCREENS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between px-5 pb-4 pt-8">
        <div className="flex gap-2" role="presentation">
          {SCREENS.map((s, i) => (
            <span
              key={s.id}
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-6 bg-primary" : "w-2 bg-border"
              }`}
            />
          ))}
        </div>
        {/* Not a dead end and not a trap: a guard who has done this before can
            get to the camera in one tap. */}
        <button
          onClick={onDone}
          className="min-h-[44px] px-2 text-sm font-medium text-muted-foreground active:text-foreground"
        >
          Skip
        </button>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-8">
        <div className="flex flex-1 flex-col justify-center overflow-y-auto py-4">
          {screen.icon && (
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-raised">
              {screen.icon}
            </div>
          )}
          <h1 className="font-display text-3xl font-bold leading-tight text-foreground">
            {screen.title}
          </h1>
          {screen.body && (
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">{screen.body}</p>
          )}
          {screen.id === "colours" && <ColoursScreen />}
          {screen.footnote && (
            <p className="mt-6 rounded-xl border border-border bg-surface p-3 text-sm text-muted-foreground">
              {screen.footnote}
            </p>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="min-h-[60px] rounded-2xl border border-border px-6 text-sm font-medium text-muted-foreground active:bg-surface-raised"
            >
              Back
            </button>
          )}
          <button
            onClick={() => (isLast ? onDone() : setStep((s) => s + 1))}
            className="flex min-h-[60px] flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            {isLast ? (
              <>
                Start scanning <Check className="h-5 w-5" aria-hidden />
              </>
            ) : (
              <>
                Next <ChevronRight className="h-5 w-5" aria-hidden />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
