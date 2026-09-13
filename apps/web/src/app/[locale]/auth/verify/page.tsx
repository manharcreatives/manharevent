"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Field, OtpInput } from "@manhar-garba/ui";
import { Sparkles } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "@/i18n/navigation";
import { DemoNotice } from "@/components/common/demo-notice";

const RESEND_SECONDS = 30;
const DEMO_OTP = "123456";

/** +919825011001 → +91 98250 11001, the way an Indian number is read aloud. */
function prettyPhone(raw: string | null) {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "").slice(-10);
  return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : raw;
}

export default function AuthVerifyPage() {
  const t = useTranslations("Auth");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const { phone, confirmPhone } = useAuthStore();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  // Someone who lands here without a number in the store has nothing to verify.
  useEffect(() => {
    if (!phone) router.replace("/auth/start");
  }, [phone, router]);

  // Demo bypass: no code is sent and none is checked. The real verification
  // lands with the backend (P-03); this screen is the one that ships either way.
  function verify(code: string) {
    if (code.length < 6) {
      setError(t("wrongCode"));
      return;
    }
    setError("");
    if (phone) confirmPhone(phone);
    router.push("/auth/profile");
  }

  function handleChange(value: string) {
    setOtp(value);
    setError("");
    // Auto-advance on the sixth digit.
    if (value.length === 6) verify(value);
  }

  return (
    <div className="mx-auto max-w-[420px] px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("verifyTitle")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("codeSentTo", { phone: prettyPhone(phone) })}
      </p>

      <div className="mt-6 space-y-4">
        <DemoNotice>{tCommon("demoOtpHint")}</DemoNotice>

        <Field label={t("otpLabel")} error={error}>
          <OtpInput value={otp} onChange={handleChange} />
        </Field>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => { setOtp(DEMO_OTP); verify(DEMO_OTP); }}
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {tCommon("useDemoCode")}
        </Button>

        <Button className="w-full" onClick={() => verify(otp)} disabled={otp.length < 6}>
          {t("verify")} →
        </Button>

        <div className="flex items-center justify-between gap-4 pt-1 text-sm">
          <button
            type="button"
            onClick={() => router.push("/auth/start")}
            className="min-h-11 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {tCommon("changeNumber")}
          </button>
          <button
            type="button"
            disabled={secondsLeft > 0}
            onClick={() => setSecondsLeft(RESEND_SECONDS)}
            className="min-h-11 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {secondsLeft > 0 ? t("resendIn", { seconds: secondsLeft }) : t("resend")}
          </button>
        </div>
      </div>
    </div>
  );
}
