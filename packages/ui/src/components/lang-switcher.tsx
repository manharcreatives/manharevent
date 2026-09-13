"use client";

import * as React from "react";
import { cn } from "../lib/utils";

const LANGS = [
  { code: "en", label: "EN" },
  { code: "gu", label: "ગુ" },
  { code: "hi", label: "हि" },
] as const;

type LangCode = (typeof LANGS)[number]["code"];

interface LangSwitcherProps {
  value: LangCode;
  onChange: (lang: LangCode) => void;
  className?: string;
}

export function LangSwitcher({ value, onChange, className }: LangSwitcherProps) {
  return (
    <div className={cn("flex rounded border border-border", className)}>
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => onChange(code)}
          // The visible chip stays compact so three languages still fit a 390px
          // header, but a ::before overlay pushes the real touch target to the
          // 44px minimum — these buttons measured 29x24 before, which is a miss
          // on a phone held one-handed at a gate.
          className={cn(
            "relative px-2.5 py-1.5 text-xs font-medium transition-colors first:rounded-l last:rounded-r",
            "before:absolute before:left-0 before:top-1/2 before:h-11 before:w-full before:-translate-y-1/2 before:content-['']",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            value === code
              ? "bg-primary text-white"
              : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"
          )}
          aria-pressed={value === code}
          lang={code}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

