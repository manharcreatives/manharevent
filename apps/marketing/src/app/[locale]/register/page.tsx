"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Field, PhoneInput, LoadingButton } from "@manhar-garba/ui";
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
    <div className="mx-auto max-w-[420px] px-4 py-16 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>

      <div className="mt-8 space-y-4">
        <Field label={t("phoneLabel")} htmlFor="phone" error={error}>
          <PhoneInput
            id="phone"
            value={phoneInput}
            onChange={(v) => { setPhoneInput(v); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          />
        </Field>

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
