"use client";

import * as React from "react";
import { cn } from "../lib/utils";

const LANGS = [
  { code: "en", label: "EN" },
  { code: "gu", label: "àª—à«" },
  { code: "hi", label: "à¤¹à¤¿" },
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
          className={cn(
            "px-2.5 py-1 text-xs font-medium transition-colors first:rounded-l last:rounded-r",
            value === code
              ? "bg-primary text-white"
              : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

