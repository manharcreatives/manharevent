"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Input } from "@manhar-garba/ui";
import { useAuthStore } from "@/lib/auth-store";
import { normalizePhone, isValidIndianPhone } from "@manhar-garba/domain";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { Phone } from "lucide-react";

// This page is reachable directly, so it needs client-side auth logic.
// The locale layout handles setRequestLocale for the wrapping RSC.
// FE-11: wired to the "Auth" i18n namespace, which had full en/gu/hi
// translations sitting unused since FE-03 — this page (and verify/profile)
// were hardcoded English despite that, a gap flagged in PROGRESS.md.
export default function AuthStartPage() {
  const t = useTranslations("Auth");
  const tLegal = useTranslations("Legal");
  const router = useRouter();
  const { setPhone } = useAuthStore();
  const [phoneInput, setPhoneInput] = useState("");
  const [error, setError] = useState("");

  function handleSend() {
    // Shared with checkout and the gate scanner's sign-in, so the same number
    // typed three different ways resolves identically on all three.
    if (!isValidIndianPhone(phoneInput)) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setError("");
    setPhone(normalizePhone(phoneInput));
    router.push("/auth/verify");
  }

  return (
    <div className="mx-auto max-w-[400px] px-4 py-16 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("signInTitle")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("demoNote")}</p>

      <div className="mt-8 space-y-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-foreground">
            {t("phoneLabel")}
          </label>
          <div className="mt-1.5 flex gap-2">
            <span className="flex items-center rounded-lg border border-border bg-surface-raised px-3 text-sm text-muted-foreground">
              +91
            </span>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              placeholder="9876543210"
              value={phoneInput}
              onChange={(e) => { setPhoneInput(e.target.value.replace(/\D/g, "")); setError(""); }}
              maxLength={10}
              className="flex-1"
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            />
          </div>
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>

        <Button className="w-full" onClick={handleSend} disabled={phoneInput.length < 10}>
          <Phone className="mr-2 h-4 w-4" />
          {t("sendOtp")}
        </Button>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        By continuing you agree to our{" "}
        <Link href="/legal/terms" className="underline">{tLegal("terms")}</Link> and{" "}
        <Link href="/legal/privacy" className="underline">{tLegal("privacy")}</Link>.
      </p>
    </div>
  );
}
