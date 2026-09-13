"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Delete, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { gateStaff, gateStaffCode } from "@manhar-garba/mock-data";
import { loadSession, signIn, SIGN_IN_ERRORS } from "@/lib/session";

type Step = "phone" | "code";

/**
 * The demo guard: the first person on the organizer's roster.
 *
 * The code is *derived* from (phone, event, serial) in
 * `packages/domain/src/logic/gate-access.ts`, so this is not a hardcoded
 * back door — it is the same code the dashboard shows on the Team page right
 * now, computed the same way. The check is real; it just isn't a secret.
 */
const DEMO_STAFF = gateStaff[0]!;
const DEMO_CODE = gateStaffCode(DEMO_STAFF);
const DEMO_PHONE = DEMO_STAFF.phone.replace(/^\+91/, "");

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

  function attempt(phoneValue: string, codeValue: string) {
    setBusy(true);
    setError(null);
    const result = signIn(phoneValue, codeValue);
    if (result.ok) {
      router.replace("/scan");
      return;
    }
    setBusy(false);
    setError(SIGN_IN_ERRORS[result.reason]);
    if (result.reason === "unknown_phone") setStep("phone");
    else setCode("");
  }

  /**
   * The demo rule: checkable, never a wall. This fills in a real roster number
   * and its real derived code and runs the same `signIn` everyone else runs — a
   * wrong code still fails visibly, this one just doesn't need to be remembered.
   */
  function useDemoCredentials() {
    setPhone(DEMO_PHONE);
    setCode(DEMO_CODE.replace("-", ""));
    setStep("code");
    attempt(DEMO_PHONE, DEMO_CODE);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background px-5 pb-6 pt-8">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15">
          <ShieldCheck className="h-6 w-6 text-primary" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-lg font-bold leading-tight text-foreground">
            Gate staff sign-in
          </h1>
          <p className="text-xs text-muted-foreground">
            Only numbers the organizer added can scan
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-warning/40 bg-warning/15 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-warning">
          Demo
        </span>
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
              className="mt-3 min-h-[44px] text-sm text-muted-foreground underline underline-offset-4"
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

        {/* Demo mode: the valid code is on screen. The check above is still the
            real one — a wrong code fails — but nobody clicking through a demo
            should ever be stuck at a login waiting for an SMS that has no
            backend to send it. */}
        <div className="mt-5 rounded-xl border border-border bg-surface p-3">
          <p className="text-xs text-muted-foreground">
            Demo mode — this roster is live. Use{" "}
            <span className="font-mono font-semibold text-foreground">
              +91 {DEMO_PHONE}
            </span>{" "}
            with code{" "}
            <span className="font-mono font-semibold text-foreground">{DEMO_CODE}</span>{" "}
            ({DEMO_STAFF.name}, {DEMO_STAFF.gateLabel}).
          </p>
          <button
            onClick={useDemoCredentials}
            disabled={busy}
            className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-primary/50 bg-primary/10 text-sm font-semibold text-primary active:scale-[0.99]"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Use demo code
          </button>
        </div>
      </div>

      <Keypad mode={step} onPress={step === "phone" ? pressPhone : pressCode} />

      <button
        disabled={busy || (step === "phone" ? !phoneReady : !codeReady)}
        onClick={() => {
          if (step === "phone") {
            setStep("code");
            setError(null);
          } else {
            attempt(phone, code);
          }
        }}
        className="mt-4 flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:bg-surface-raised disabled:text-placeholder"
      >
        {busy ? (
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        ) : (
          <>
            {step === "phone" ? "Next" : "Start scanning"}
            <ArrowRight className="h-5 w-5" aria-hidden />
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
          key === "" ? <div key={i} /> : <Key key={i} value={key} onPress={onPress} />
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
      {isDelete ? (
        <Delete className={compact ? "h-4 w-4" : "h-6 w-6"} aria-hidden />
      ) : (
        value
      )}
    </button>
  );
}
