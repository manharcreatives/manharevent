"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Field, Input, OtpInput, LoadingButton, Button } from "@manhar-garba/ui";
import { Sparkles } from "lucide-react";
import { useRegistrationStore } from "@/lib/registration-store";
import { useRouter } from "@/i18n/navigation";
import { submitApplicationAction } from "@/app/actions/registration";
import { RegisterSteps } from "@/components/register/register-steps";
import { DemoNotice } from "@/components/demo-notice";

type Step = "otp" | "details";

interface FormState {
  orgName: string;
  contactName: string;
  city: string;
  roughCapacity: string;
  desiredDomain: string;
}

const EMPTY_FORM: FormState = { orgName: "", contactName: "", city: "", roughCapacity: "", desiredDomain: "" };

/** A plausible Ahmedabad samiti, so the demo never stalls on data entry. */
const DEMO_FORM: FormState = {
  orgName: "Rangeela Garba Samiti",
  contactName: "Nirav Trivedi",
  city: "Ahmedabad",
  roughCapacity: "4000",
  desiredDomain: "rangeela",
};

const DEMO_OTP = "123456";

/** +919825011001 → +91 98250 11001, the way an Indian number is read aloud. */
function prettyPhone(raw: string | null) {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) return raw;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

export default function RegisterVerifyPage() {
  const t = useTranslations("Register");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const { phone, setApplicationId } = useRegistrationStore();

  const [step, setStep] = useState<Step>("otp");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resent, setResent] = useState(false);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function advance(code: string) {
    if (code.length < 6) {
      setOtpError(t("otpError"));
      return;
    }
    setOtpError("");
    // Demo bypass: no SMS is sent and no code is checked. The real verification
    // lands with the backend (P-03); the UI here is the one that ships.
    setStep("details");
  }

  function handleOtpChange(value: string) {
    setOtp(value);
    setOtpError("");
    // Auto-advance on the sixth digit — nobody should have to reach for a
    // button after typing a complete code.
    if (value.length === 6) advance(value);
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
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const { applicationId } = await submitApplicationAction({
        orgName: form.orgName.trim(),
        contactName: form.contactName.trim(),
        // A visitor who deep-links here has no stored number; the demo number
        // keeps the application well-formed instead of failing validation.
        phone: phone ?? "+919825011001",
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
    <div className="mx-auto max-w-[480px] px-4 py-12 sm:px-6 sm:py-16">
      <RegisterSteps current={step === "otp" ? 2 : 3} />

      {step === "otp" && (
        <>
          <h1 className="mt-6 font-display text-2xl font-bold text-foreground">{t("otpTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("otpSubtitle", { phone: prettyPhone(phone) })}
          </p>

          <div className="mt-6 space-y-4">
            <DemoNotice>{tCommon("demoOtpHint")}</DemoNotice>

            <Field label={t("otpLabel")} error={otpError}>
              <OtpInput value={otp} onChange={handleOtpChange} />
            </Field>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                setOtp(DEMO_OTP);
                advance(DEMO_OTP);
              }}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {tCommon("useDemoCode")}
            </Button>

            <LoadingButton className="w-full" onClick={() => advance(otp)} disabled={otp.length < 6}>
              {t("verify")}
            </LoadingButton>

            <div className="flex items-center justify-between gap-4 pt-1 text-sm">
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="min-h-11 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {t("changeNumber")}
              </button>
              <button
                type="button"
                onClick={() => setResent(true)}
                className="min-h-11 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {resent ? t("otpResent") : t("otpResend")}
              </button>
            </div>
          </div>
        </>
      )}

      {step === "details" && (
        <>
          <h1 className="mt-6 font-display text-2xl font-bold text-foreground">{t("detailsTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("detailsSubtitle")}</p>

          <div className="mt-6 space-y-4">
            <DemoNotice>{t("demoDetailsHint")}</DemoNotice>

            <Button variant="outline" className="w-full gap-2" onClick={() => { setForm(DEMO_FORM); setErrors({}); }}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {t("useDemoDetails")}
            </Button>

            <Field label={t("orgNameLabel")} htmlFor="orgName" error={errors.orgName}>
              <Input
                id="orgName"
                name="orgName"
                autoComplete="organization"
                placeholder={t("orgNamePlaceholder")}
                value={form.orgName}
                onChange={(e) => updateField("orgName", e.target.value)}
              />
            </Field>

            <Field label={t("contactNameLabel")} htmlFor="contactName" error={errors.contactName}>
              <Input
                id="contactName"
                name="contactName"
                autoComplete="name"
                placeholder={t("contactNamePlaceholder")}
                value={form.contactName}
                onChange={(e) => updateField("contactName", e.target.value)}
              />
            </Field>

            <Field label={t("cityLabel")} htmlFor="city" error={errors.city}>
              <Input
                id="city"
                name="city"
                autoComplete="address-level2"
                placeholder={t("cityPlaceholder")}
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
              />
            </Field>

            <Field
              label={t("capacityLabel")}
              htmlFor="roughCapacity"
              error={errors.roughCapacity}
              hint={t("capacityHelp")}
            >
              <Input
                id="roughCapacity"
                name="roughCapacity"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder={t("capacityPlaceholder")}
                value={form.roughCapacity}
                onChange={(e) => updateField("roughCapacity", e.target.value)}
              />
            </Field>

            <Field
              label={t("domainLabel")}
              htmlFor="desiredDomain"
              error={errors.desiredDomain}
              hint={t("domainHelp")}
            >
              <div className="flex items-stretch">
                <Input
                  id="desiredDomain"
                  name="desiredDomain"
                  className="rounded-r-none"
                  placeholder={t("domainPlaceholder")}
                  value={form.desiredDomain}
                  onChange={(e) => updateField("desiredDomain", e.target.value)}
                />
                <span className="flex items-center rounded-r-lg border border-l-0 border-border bg-surface-raised px-3 text-sm text-muted-foreground">
                  {t("domainSuffix")}
                </span>
              </div>
            </Field>

            {submitError && (
              <p role="alert" className="text-sm text-destructive">
                {submitError}
              </p>
            )}

            <LoadingButton className="w-full" loading={submitting} onClick={handleSubmit}>
              {submitting ? t("submitting") : t("submit")}
            </LoadingButton>

            <p className="text-xs leading-relaxed text-muted-foreground">{t("reviewNote")}</p>

            <button
              type="button"
              onClick={() => setStep("otp")}
              className="min-h-11 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {t("backToOtp")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
