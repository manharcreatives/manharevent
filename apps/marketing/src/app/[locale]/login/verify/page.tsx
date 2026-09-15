"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Field, OtpInput, LoadingButton, Button } from "@manhar-garba/ui";
import { Sparkles, ArrowRight } from "lucide-react";
import { useLoginStore } from "@/lib/login-store";
import { useRouter, Link } from "@/i18n/navigation";
import { verifyLoginOtpAction } from "@/app/actions/login";
import { DemoNotice } from "@/components/demo-notice";

const DEMO_OTP = "123456";
const DASHBOARD_APP_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";

/** +919825011001 → +91 98250 11001, the way an Indian number is read aloud. */
function prettyPhone(raw: string | null) {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) return raw;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

export default function LoginVerifyPage() {
  const t = useTranslations("Login");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const { phone } = useLoginStore();

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [checking, setChecking] = useState(false);
  const [failure, setFailure] = useState<"not_found" | "under_review" | null>(null);
  const [success, setSuccess] = useState(false);

  async function advance(code: string) {
    if (code.length < 6) {
      setOtpError(t("otpError"));
      return;
    }
    if (!phone) {
      router.push("/login");
      return;
    }
    setOtpError("");
    setFailure(null);
    setChecking(true);
    const result = await verifyLoginOtpAction(phone, code);
    setChecking(false);
    if (result.ok) {
      setSuccess(true);
      window.location.href = `${DASHBOARD_APP_URL}/dashboard`;
    } else {
      setFailure(result.reason);
    }
  }

  function handleOtpChange(value: string) {
    setOtp(value);
    setOtpError("");
    setFailure(null);
    if (value.length === 6) advance(value);
  }

  if (!phone) {
    return (
      <div className="mx-auto max-w-[420px] px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-muted-foreground">{t("phoneError")}</p>
        <Button asChild className="mt-4"><Link href="/login">{t("tryAgain")}</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[480px] px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("otpTitle")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("otpSubtitle", { phone: prettyPhone(phone) })}</p>

      <div className="mt-6 space-y-4">
        <DemoNotice>{tCommon("demoOtpHint")}</DemoNotice>

        <Field label={t("otpLabel")} error={otpError}>
          <OtpInput value={otp} onChange={handleOtpChange} />
        </Field>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => { setOtp(DEMO_OTP); advance(DEMO_OTP); }}
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {tCommon("useDemoCode")}
        </Button>

        <LoadingButton
          className="w-full gap-2"
          loading={checking || success}
          disabled={otp.length < 6}
          onClick={() => advance(otp)}
        >
          {success ? t("redirecting") : t("verify")}
          {!checking && !success && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </LoadingButton>

        {failure === "not_found" && (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
            <p className="font-medium text-foreground">{t("notFoundTitle")}</p>
            <p className="mt-1 text-muted-foreground">{t("notFoundBody")}</p>
            <Button asChild size="sm" variant="outline" className="mt-3">
              <Link href="/register">{t("registerCta")}</Link>
            </Button>
          </div>
        )}

        {failure === "under_review" && (
          <div role="alert" className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
            <p className="font-medium text-foreground">{t("underReviewTitle")}</p>
            <p className="mt-1 text-muted-foreground">{t("underReviewBody")}</p>
            <Button asChild size="sm" variant="outline" className="mt-3">
              <Link href="/register/status">{t("checkStatusCta")}</Link>
            </Button>
          </div>
        )}

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="min-h-11 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t("changeNumber")}
        </button>
      </div>
    </div>
  );
}
