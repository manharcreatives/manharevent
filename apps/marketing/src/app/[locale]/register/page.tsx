"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Field, PhoneInput, LoadingButton, Button } from "@manhar-garba/ui";
import { Sparkles } from "lucide-react";
import { RegisterSteps } from "@/components/register/register-steps";
import { DemoNotice } from "@/components/demo-notice";
import { useRegistrationStore } from "@/lib/registration-store";
import { useRouter } from "@/i18n/navigation";

export default function RegisterPage() {
  const t = useTranslations("Register");
  const router = useRouter();
  const { setPhone } = useRegistrationStore();
  const [phoneInput, setPhoneInput] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (phoneInput.length !== 10) {
      setError(t("phoneError"));
      return;
    }
    setError("");
    setSending(true);
    // Mock OTP dispatch — a real send would call an SMS provider here.
    await new Promise((resolve) => setTimeout(resolve, 500));
    setPhone(`+91${phoneInput}`);
    setSending(false);
    router.push("/register/verify");
  }

  return (
    <div className="mx-auto max-w-[420px] px-4 py-12 sm:px-6 sm:py-16">
      <RegisterSteps current={1} />

      <h1 className="mt-6 font-display text-2xl font-bold text-foreground">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>

      <div className="mt-6 space-y-4">
        <DemoNotice>{t("demoPhoneHint")}</DemoNotice>

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
          {t("useDemoNumber")}
        </Button>

        <LoadingButton
          className="w-full"
          loading={sending}
          disabled={phoneInput.length !== 10}
          onClick={handleSend}
        >
          {t("sendOtp")}
        </LoadingButton>
      </div>
    </div>
  );
}
