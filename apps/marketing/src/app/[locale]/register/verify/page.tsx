"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Field, Input, OtpInput, LoadingButton } from "@manhar-garba/ui";
import { useRegistrationStore } from "@/lib/registration-store";
import { useRouter } from "@/i18n/navigation";
import { submitApplicationAction } from "@/app/actions/registration";

type Step = "otp" | "details";

interface FormState {
  orgName: string;
  contactName: string;
  city: string;
  roughCapacity: string;
  desiredDomain: string;
}

const EMPTY_FORM: FormState = { orgName: "", contactName: "", city: "", roughCapacity: "", desiredDomain: "" };

export default function RegisterVerifyPage() {
  const t = useTranslations("Register");
  const router = useRouter();
  const { phone, setApplicationId } = useRegistrationStore();

  const [step, setStep] = useState<Step>("otp");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function handleVerify() {
    if (otp.length < 6) {
      setOtpError(t("otpError"));
      return;
    }
    setOtpError("");
    // Mock: any 6-digit OTP passes
    setStep("details");
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.orgName.trim()) next.orgName = t("fieldRequired");
    if (!form.contactName.trim()) next.contactName = t("fieldRequired");
    if (!form.city.trim()) next.city = t("fieldRequired");
    if (!form.desiredDomain.trim()) next.desiredDomain = t("fieldRequired");
    const capacity = Number(form.roughCapacity);
    if (!form.roughCapacity || !Number.isFinite(capacity) || capacity <= 0) {
      next.roughCapacity = t("capacityInvalid");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate() || !phone) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const { applicationId } = await submitApplicationAction({
        orgName: form.orgName.trim(),
        contactName: form.contactName.trim(),
        phone,
        city: form.city.trim(),
        roughCapacity: Number(form.roughCapacity),
        desiredDomain: form.desiredDomain.trim().toLowerCase().replace(/\s+/g, "-"),
      });
      setApplicationId(applicationId);
      router.push("/register/status");
    } catch {
      setSubmitError(t("submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[480px] px-4 py-16 sm:px-6">
      {step === "otp" && (
        <>
          <h1 className="font-display text-2xl font-bold text-foreground">{t("otpTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("otpSubtitle", { phone: phone ?? "" })}
          </p>

          <div className="mt-8 space-y-4">
            <Field label={t("otpLabel")} hint={t("otpDemoNote")} error={otpError}>
              <OtpInput value={otp} onChange={(v) => { setOtp(v); setOtpError(""); }} />
            </Field>

            <LoadingButton className="w-full" onClick={handleVerify} disabled={otp.length < 6}>
              {t("verify")}
            </LoadingButton>
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              {t("changeNumber")}
            </button>
          </div>
        </>
      )}

      {step === "details" && (
        <>
          <h1 className="font-display text-2xl font-bold text-foreground">{t("detailsTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("detailsSubtitle")}</p>

          <div className="mt-8 space-y-4">
            <Field label={t("orgNameLabel")} htmlFor="orgName" error={errors.orgName}>
              <Input
                id="orgName"
                placeholder={t("orgNamePlaceholder")}
                value={form.orgName}
                onChange={(e) => updateField("orgName", e.target.value)}
              />
            </Field>

            <Field label={t("contactNameLabel")} htmlFor="contactName" error={errors.contactName}>
              <Input
                id="contactName"
                placeholder={t("contactNamePlaceholder")}
                value={form.contactName}
                onChange={(e) => updateField("contactName", e.target.value)}
              />
            </Field>

            <Field label={t("cityLabel")} htmlFor="city" error={errors.city}>
              <Input
                id="city"
                placeholder={t("cityPlaceholder")}
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
              />
            </Field>

            <Field label={t("capacityLabel")} htmlFor="roughCapacity" error={errors.roughCapacity}>
              <Input
                id="roughCapacity"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder={t("capacityPlaceholder")}
                value={form.roughCapacity}
                onChange={(e) => updateField("roughCapacity", e.target.value)}
              />
            </Field>

            <Field label={t("domainLabel")} htmlFor="desiredDomain" error={errors.desiredDomain} hint={t("domainSuffix")}>
              <Input
                id="desiredDomain"
                placeholder={t("domainPlaceholder")}
                value={form.desiredDomain}
                onChange={(e) => updateField("desiredDomain", e.target.value)}
              />
            </Field>

            {submitError && <p className="text-sm text-destructive">{submitError}</p>}

            <LoadingButton className="w-full" loading={submitting} onClick={handleSubmit}>
              {submitting ? t("submitting") : t("submit")}
            </LoadingButton>
          </div>
        </>
      )}
    </div>
  );
}
