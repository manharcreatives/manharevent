"use client";

import { useState } from "react";
import { Delete, CornerDownLeft } from "lucide-react";

interface Props {
  onSubmit: (code: string) => void;
  onCancel: () => void;
}

const KEYS = ["1","2","3","4","5","6","7","8","9","-","0","⌫"];

export function ManualCodeEntry({ onSubmit, onCancel }: Props) {
  const [value, setValue] = useState("");

  function tap(key: string) {
    if (key === "⌫") {
      setValue((v) => v.slice(0, -1));
    } else {
      setValue((v) => (v.length < 18 ? v + key : v));
    }
  }

  function submit() {
    const code = value.trim().toUpperCase();
    if (code.length >= 4) {
      onSubmit(code);
      setValue("");
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Display */}
      <div className="rounded-xl border border-border bg-surface-raised p-3 min-h-[52px] flex items-center justify-between">
        <span className="font-mono text-xl tracking-widest text-foreground break-all">
          {value || <span className="text-muted-foreground">Enter pass code</span>}
        </span>
        {value && (
          <button
            onClick={() => setValue("")}
            className="ml-2 shrink-0 text-muted-foreground"
            aria-label="Clear"
          >
            <Delete className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Also allow keyboard input */}
      <input
        type="text"
        className="sr-only"
        value={value}
        onChange={(e) => setValue(e.target.value.toUpperCase())}
        aria-label="Type pass code"
      />

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((k) => (
          <button
            key={k}
            onClick={() => tap(k)}
            className={`flex min-h-[64px] items-center justify-center rounded-xl text-2xl font-medium transition-colors active:scale-95 ${
              k === "⌫"
                ? "bg-surface-raised text-muted-foreground"
                : "bg-surface text-foreground active:bg-surface-raised"
            }`}
            aria-label={k === "⌫" ? "Backspace" : k}
          >
            {k === "⌫" ? <Delete className="h-6 w-6" /> : k}
          </button>
        ))}
      </div>

      {/* Also allow alphabetic input via text field */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Or type code here…"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
          className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 font-mono text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Pass code"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl border border-border py-4 text-sm font-medium text-muted-foreground active:bg-surface-raised"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={value.trim().length < 4}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-bold text-white disabled:opacity-40 active:bg-primary/90"
          aria-label="Validate pass"
        >
          <CornerDownLeft className="h-4 w-4" />
          Validate
        </button>
      </div>
    </div>
  );
}
