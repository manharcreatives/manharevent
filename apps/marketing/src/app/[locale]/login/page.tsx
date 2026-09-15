"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Field, PhoneInput, LoadingButton, Button } from "@manhar-garba/ui";
import { Sparkles } from "lucide-react";
import { DemoNotice } from "@/components/demo-notice";
import { useLoginStore } from "@/lib/login-store";
import { useRouter } from "@/i18n/navigation";

const DASHBOARD_APP_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const t = useTranslations("Login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPhone } = useLoginStore();
  // Prefilled from /register/provisioned's "Login to your dashboard" link.
  const prefill = searchParams.get("phone") ?? "";
  const [phoneInput, setPhoneInput] = useState(/^\d{10}$/.test(prefill) ? prefill : "");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (phoneInput.length !== 10) {
      setError(t("phoneError"));
      return;
    }
    setError("");
    setSending(true);
    // Mock OTP dispatch — mirrors /register's own demo bypass, no SMS provider here.
    await new Promise((resolve) => setTimeout(resolve, 500));
    setPhone(`+91${phoneInput}`);
    setSending(false);
    router.push("/login/verify");
  }

  return (
    <div className="mx-auto max-w-[420px] px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("title")}</h1>
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
          onClick={() => { setPhoneInput("9033344556"); setError(""); }}
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

        <a
          href={`${DASHBOARD_APP_URL}/dashboard?demo=manhar`}
          className="block text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t("viewDemoInstead")}
        </a>
      </div>
    </div>
  );
}
