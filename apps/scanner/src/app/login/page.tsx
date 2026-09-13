"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Delete, ArrowRight, Loader2 } from "lucide-react";
import { loadSession, signIn, SIGN_IN_ERRORS } from "@/lib/session";

type Step = "phone" | "code";

/**
 * Gate-staff sign-in.
 *
 * Designed for the actual conditions: one hand, a phone held at chest height,
 * outdoors, at night, with a queue waiting. So — an on-screen keypad instead of
 * the OS keyboard (which covers half the screen and guesses wrong on a code
 * like `H7K-2Q9`), 64px targets, and no scrolling at any step.
 */
export default function GateLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loadSession()) router.replace("/scan");
  }, [router]);

  const phoneReady = phone.length === 10;
  const codeReady = code.length === 6;

  function pressPhone(key: string) {
    setError(null);
    if (key === "del") setPhone((p) => p.slice(0, -1));
    else if (phone.length < 10) setPhone((p) => p + key);
  }

  function pressCode(key: string) {
    setError(null);
    if (key === "del") setCode((c) => c.slice(0, -1));
    else if (code.length < 6) setCode((c) => c + key);
  }

  function submit() {
    setBusy(true);
    setError(null);
    const result = signIn(phone, code);
    if (result.ok) {
      router.replace("/scan");
      return;
    }
    setBusy(false);
    setError(SIGN_IN_ERRORS[result.reason]);
    if (result.reason === "unknown_phone") setStep("phone");
    else setCode("");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background px-5 pb-6 pt-8">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-lg font-bold leading-tight text-foreground">
            Gate staff sign-in
          </h1>
          <p className="text-xs text-muted-foreground">
            Only numbers the organizer added can scan
          </p>
        </div>
      </header>

      <div className="mt-7 flex-1">
        {step === "phone" ? (
          <>
            <label className="text-sm font-medium text-muted-foreground" htmlFor="gate-phone">
              Your mobile number
            </label>
            <div
              id="gate-phone"
              className="mt-2 flex h-16 items-center gap-2 rounded-xl border border-border bg-surface px-4"
            >
              <span className="font-mono text-xl text-muted-foreground">+91</span>
              <span className="font-mono text-2xl tracking-[0.12em] text-foreground">
                {phone || <span className="text-placeholder">98765 43210</span>}
              </span>
            </div>
          </>
        ) : (
          <>
            <label className="text-sm font-medium text-muted-foreground" htmlFor="gate-code">
              6-digit code from the organizer
            </label>
            <div id="gate-code" className="mt-2 flex gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex h-16 flex-1 items-center justify-center rounded-xl border text-2xl font-bold ${
                    code[i]
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-surface text-placeholder"
                  }`}
                >
                  {code[i] ?? ""}
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
              }}
              className="mt-3 text-sm text-muted-foreground underline underline-offset-4"
            >
              +91 {phone} — change
            </button>
          </>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-foreground"
          >
            {error}
          </p>
        )}
      </div>

      <Keypad
        mode={step}
        onPress={step === "phone" ? pressPhone : pressCode}
      />

      <button
        disabled={busy || (step === "phone" ? !phoneReady : !codeReady)}
        onClick={() => {
          if (step === "phone") {
            setStep("code");
            setError(null);
          } else {
            submit();
          }
        }}
        className="mt-4 flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:bg-surface-raised disabled:text-placeholder"
      >
        {busy ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <>
            {step === "phone" ? "Next" : "Start scanning"}
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>
    </div>
  );
}

/**
 * The code alphabet deliberately excludes O/0 and I/1/L, so the letter rows
 * here match `packages/domain/src/logic/gate-access.ts` exactly — a guard can
 * never be shown a key that can't appear in a real code.
 */
const LETTER_ROWS = [
  ["A", "B", "C", "D", "E", "F"],
  ["G", "H", "J", "K", "M", "N"],
  ["P", "Q", "R", "S", "T", "U"],
  ["V", "W", "X", "Y", "Z", "del"],
];

const DIGIT_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "del"],
];

function Keypad({ mode, onPress }: { mode: Step; onPress: (key: string) => void }) {
  if (mode === "phone") {
    return (
      <div className="grid grid-cols-3 gap-2">
        {DIGIT_ROWS.flat().map((key, i) =>
          key === "" ? (
            <div key={i} />
          ) : (
            <Key key={i} value={key} onPress={onPress} />
          )
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-6 gap-1.5">
        {["2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <Key key={d} value={d} onPress={onPress} compact />
        ))}
      </div>
      {LETTER_ROWS.map((row, i) => (
        <div key={i} className="grid grid-cols-6 gap-1.5">
          {row.map((key) => (
            <Key key={key} value={key} onPress={onPress} compact />
          ))}
        </div>
      ))}
    </div>
  );
}

function Key({
  value,
  onPress,
  compact = false,
}: {
  value: string;
  onPress: (key: string) => void;
  compact?: boolean;
}) {
  const isDelete = value === "del";
  return (
    <button
      onClick={() => onPress(value)}
      aria-label={isDelete ? "Delete" : value}
      className={`flex items-center justify-center rounded-xl bg-surface-raised font-semibold text-foreground transition-transform active:scale-95 active:bg-surface ${
        compact ? "h-12 text-base" : "h-16 text-2xl"
      }`}
    >
      {isDelete ? <Delete className={compact ? "h-4 w-4" : "h-6 w-6"} /> : value}
    </button>
  );
}
