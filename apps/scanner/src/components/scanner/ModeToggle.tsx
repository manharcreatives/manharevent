"use client";

import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

interface Props {
  mode: "in" | "out";
  onChange: (mode: "in" | "out") => void;
}

export function ModeToggle({ mode, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-surface p-1">
      <button
        onClick={() => onChange("in")}
        className={`flex min-h-[40px] min-w-[64px] items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
          mode === "in"
            ? "bg-success text-white"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-pressed={mode === "in"}
        aria-label="Entry mode"
      >
        <ArrowDownToLine className="h-4 w-4" />
        Entry
      </button>
      <button
        onClick={() => onChange("out")}
        className={`flex min-h-[40px] min-w-[64px] items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
          mode === "out"
            ? "bg-warning text-black"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-pressed={mode === "out"}
        aria-label="Exit mode"
      >
        <ArrowUpFromLine className="h-4 w-4" />
        Exit
      </button>
    </div>
  );
}
