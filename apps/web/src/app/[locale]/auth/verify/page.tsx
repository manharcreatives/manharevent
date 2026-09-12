"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Input } from "@manhar-garba/ui";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "@/i18n/navigation";

// FE-11: wired to the "Auth" i18n namespace — see auth/start's file comment.
export default function AuthVerifyPage() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const { phone } = useAuthStore();
  const [otp, setOtp] = useState("");

  function handleVerify() {
    if (otp.length < 4) return;
    // Mock: any OTP passes
    router.push("/auth/profile");
  }

  return (
    <div className="mx-auto max-w-[400px] px-4 py-16 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("otpLabel")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Code sent to <strong>{phone ?? "your number"}</strong>.
      </p>

      <div className="mt-8 space-y-4">
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-foreground">
            {t("otpLabel")} <span className="text-muted-foreground text-xs">({t("demoNote")})</span>
          </label>
          <Input
            id="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="mt-1.5 tracking-widest"
            onKeyDown={(e) => { if (e.key === "Enter") handleVerify(); }}
          />
        </div>

        <Button className="w-full" onClick={handleVerify} disabled={otp.length < 4}>
          {t("verify")} →
        </Button>
        <button
          onClick={() => router.push("/auth/start")}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Change number
        </button>
      </div>
    </div>
  );
}
