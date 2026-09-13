"use client";

import { useState } from "react";
import { Delete, CornerDownLeft } from "lucide-react";
import { normalizePassCode } from "@/lib/crypto";

interface Props {
  onSubmit: (code: string) => void;
  onCancel: () => void;
}

/**
 * Pass codes look like `MG26-7F3K-9021` — four of those fourteen characters are
 * letters. The old keypad offered 0-9 and a dash, so the fallback for "the
 * camera won't read this pass" could not type most pass codes at all; the only
 * way in was a text field hidden under the keypad.
 */
const ROWS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K"],
  ["L", "M", "N", "P", "Q", "R", "S", "T", "U", "V"],
  ["W", "X", "Y", "Z", "-", "del"],
];

const MAX_LEN = 20;

export function ManualCodeEntry({ onSubmit, onCancel }: Props) {
  const [value, setValue] = useState("");

  function tap(key: string) {
    if (key === "del") setValue((v) => v.slice(0, -1));
    else setValue((v) => (v.length < MAX_LEN ? v + key : v));
  }

  const ready = value.replace(/-/g, "").length >= 4;

  function submit() {
    if (!ready) return;
    onSubmit(normalizePassCode(value));
    setValue("");
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      <div>
        <label
          htmlFor="manual-pass-code"
          className="text-sm font-medium text-muted-foreground"
        >
          Pass code — printed under the QR
        </label>
        {/* A real input, not a fake display: phones with a keyboard, and anyone
            pasting a code from WhatsApp, both need somewhere to put it. */}
        <input
          id="manual-pass-code"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          placeholder="MG26-7F3K-9021"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, MAX_LEN))}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          className="mt-2 h-16 w-full rounded-xl border border-border bg-surface px-4 font-mono text-2xl tracking-[0.08em] text-foreground placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="space-y-1.5">
        {ROWS.map((row, i) => (
          <div key={i} className="grid grid-cols-10 gap-1.5">
            {row.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => tap(key)}
                aria-label={key === "del" ? "Backspace" : key}
                className={`flex h-12 items-center justify-center rounded-lg text-base font-semibold transition-transform active:scale-95 ${
                  key === "del"
                    ? "col-span-2 bg-surface text-muted-foreground active:bg-surface-raised"
                    : "bg-surface-raised text-foreground active:bg-surface"
                }`}
              >
                {key === "del" ? <Delete className="h-5 w-5" aria-hidden /> : key}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-auto flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[56px] flex-1 rounded-xl border border-border text-sm font-medium text-muted-foreground active:bg-surface-raised"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!ready}
          className="flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-base font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:bg-surface-raised disabled:text-placeholder"
        >
          <CornerDownLeft className="h-5 w-5" aria-hidden />
          Check pass
        </button>
      </div>
    </div>
  );
}
