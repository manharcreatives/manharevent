"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Field, PhoneInput } from "@manhar-garba/ui";
import { normalizePhone, isValidIndianPhone } from "@manhar-garba/domain";
import { Phone, Sparkles } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Link, useRouter } from "@/i18n/navigation";
import { DemoNotice } from "@/components/common/demo-notice";

export default function AuthStartPage() {
  const t = useTranslations("Auth");
  const tCommon = useTranslations("Common");
  const tCheckout = useTranslations("Checkout");
  const router = useRouter();
  const { setPhone } = useAuthStore();
  const [phoneInput, setPhoneInput] = useState("");
  const [error, setError] = useState("");

  function handleSend() {
    // Shared with checkout and the gate scanner's sign-in, so the same number
    // typed three different ways resolves identically on all three.
    if (!isValidIndianPhone(phoneInput)) {
      setError(t("invalidPhone"));
      return;
    }
    setError("");
    setPhone(normalizePhone(phoneInput));
    router.push("/auth/verify");
  }

  return (
    <div className="mx-auto max-w-[420px] px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("signInTitle")}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("signInSubtitle")}</p>

      <div className="mt-6 space-y-4">
        <DemoNotice>{tCheckout("demoPhoneHint")}</DemoNotice>

        <Field label={t("phoneLabel")} htmlFor="phone" error={error}>
          <PhoneInput
            id="phone"
            value={phoneInput}
            onChange={(v) => { setPhoneInput(v); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          />
        </Field>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => { setPhoneInput("9825011001"); setError(""); }}
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {tCheckout("useDemoNumber")}
        </Button>

        <Button className="w-full" onClick={handleSend} disabled={phoneInput.length < 10}>
          <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
          {t("sendOtp")}
        </Button>
      </div>

      <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
        {t.rich("agreeToTerms", {
          terms: (chunks) => (
            <Link href="/legal/terms" className="underline underline-offset-2 hover:text-foreground">
              {chunks}
            </Link>
          ),
          privacy: (chunks) => (
            <Link href="/legal/privacy" className="underline underline-offset-2 hover:text-foreground">
              {chunks}
            </Link>
          ),
        })}
      </p>
      <span className="sr-only">{tCommon("demoMode")}</span>
    </div>
  );
}
