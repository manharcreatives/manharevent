"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { Order, Pass } from "@manhar-garba/domain";
import { computeFees, normalizePhone, isValidIndianPhone } from "@manhar-garba/domain";
import { Button, Input, FeeBreakdown, OtpInput } from "@manhar-garba/ui";
import { useCartStore } from "@/lib/cart-store";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "@/i18n/navigation";
import { payMockOrder } from "@/app/actions/order";
import { Shield, Phone, MessageSquare, Sparkles } from "lucide-react";
import { DemoNotice } from "@/components/common/demo-notice";

type CheckoutStep = "contact" | "otp" | "pay";

interface Props {
  order: Order;
  existingPasses: Pass[];
}

export function CheckoutClient({ order }: Props) {
  const t = useTranslations("Checkout");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const cart = useCartStore();
  const { phone, name, setPhone, setName, confirmPhone } = useAuthStore();

  const [step, setStep] = useState<CheckoutStep>(phone ? "pay" : "contact");
  const [phoneInput, setPhoneInput] = useState(phone ?? "");
  const [nameInput, setNameInput] = useState(name ?? "");
  const [otp, setOtp] = useState("");
  const [isPending, startTransition] = useTransition();
  const [phoneError, setPhoneError] = useState("");

  const subtotal = cart.pricePaise * cart.quantity;
  // Two honest, separate fee lines (2026-09-12 pivot) — never bundled into
  // one "convenience fee". Platform fee is ManharEvent's own and kept
  // minimal; gateway fee is Razorpay's pass-through and not ManharEvent's
  // to set. The rates live in `computeFees` so that /pricing, the booking
  // screen, and this page can never quote three different numbers.
  const {
    platformFeePaise: platformFee,
    gatewayFeePaise: gatewayFee,
    gstPaise: gst,
    totalPaise: total,
  } = computeFees(subtotal);
  const totalFormatted = new Intl.NumberFormat(locale === "en" ? "en-IN" : `${locale}-IN`, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: total % 100 === 0 ? 0 : 2,
  }).format(total / 100);

  function handleSendOtp() {
    // Shared with the gate scanner's sign-in, so "98765 43210", "098765…"
    // and "+91 98765-43210" all resolve the same way on both surfaces.
    if (!isValidIndianPhone(phoneInput)) {
      setPhoneError(t("invalidPhone"));
      return;
    }
    setPhoneError("");
    setPhone(normalizePhone(phoneInput));
    setStep("otp");
  }

  // Demo bypass: no code is sent and none is checked. The real verification
  // lands with the backend (P-09); this UI is the one that ships either way.
  function handleVerifyOtp(code = otp) {
    if (code.length < 6) return;
    // Clearing the code is what makes the session real, here as in /auth/verify
    // — so a buyer who checks out is signed in afterwards and can find the pass
    // again under My Passes without signing in a second time.
    if (phone) confirmPhone(phone);
    setStep("pay");
  }

  function handleOtpChange(value: string) {
    setOtp(value);
    // Auto-advance on the sixth digit — nobody should have to reach for a
    // button after typing a complete code.
    if (value.length === 6) handleVerifyOtp(value);
  }

  function handleMockPay() {
    if (nameInput.trim()) setName(nameInput.trim());
    startTransition(async () => {
      // Mock payment — no real Razorpay call. If the cart carries a real
      // selection (the normal path, via /e/[slug]/book), issue passes now;
      // this is the mock stand-in for a verified payment webhook.
      // Without a selection there is nothing to issue — previously this fell
      // through to the success page anyway, which then said "passes are being
      // generated" for an order that would never have any. Send the buyer back
      // to choose instead.
      if (!cart.passTypeId || !cart.zoneId || cart.quantity < 1) {
        router.push(cart.eventSlug ? `/e/${cart.eventSlug}/book` : "/");
        return;
      }
      {
        await payMockOrder({
          orderId: order.id,
          passTypeId: cart.passTypeId,
          zoneId: cart.zoneId,
          quantity: cart.quantity,
          admitsPerPass: cart.passTypeAdmits,
          nightIds: cart.passTypeNightIds,
          unitPricePaise: cart.pricePaise,
          subtotalPaise: subtotal,
          platformFeePaise: platformFee,
          gatewayFeePaise: gatewayFee,
          gstPaise: gst,
          totalPaise: total,
        });
      }
      router.push(`/checkout/${order.id}/status`);
    });
  }

  return (
    <div className="mx-auto max-w-[480px] px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Order #{order.order_number}</p>

      {/* ── Contact step ─────────────────────────────────────────────────── */}
      {step === "contact" && (
        <div className="mt-8 space-y-5">
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
                placeholder={t("phonePlaceholder")}
                value={phoneInput.replace(/^\+91/, "")}
                onChange={(e) => { setPhoneInput(e.target.value); setPhoneError(""); }}
                maxLength={10}
                className="flex-1"
              />
            </div>
            {phoneError && <p className="mt-1 text-xs text-destructive">{phoneError}</p>}
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-border bg-surface p-3 text-xs text-muted-foreground">
            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            {t("whatsappDelivery")}
          </div>

          <DemoNotice>{t("demoPhoneHint")}</DemoNotice>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => { setPhoneInput("9825011001"); setPhoneError(""); }}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {t("useDemoNumber")}
          </Button>

          <Button className="w-full" onClick={handleSendOtp}>
            <Phone className="mr-2 h-4 w-4" />
            {t("sendOtp")}
          </Button>
        </div>
      )}

      {/* ── OTP step ─────────────────────────────────────────────────────── */}
      {step === "otp" && (
        <div className="mt-8 space-y-5">
          <p className="text-sm text-muted-foreground">{t("otpSent", { phone: phone ?? "" })}</p>
          <DemoNotice>{tCommon("demoOtpHint")}</DemoNotice>

          <div>
            <span className="block text-sm font-medium text-foreground">{t("otpLabel")}</span>
            <div className="mt-1.5">
              <OtpInput value={otp} onChange={handleOtpChange} />
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => { setOtp("123456"); handleVerifyOtp("123456"); }}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {tCommon("useDemoCode")}
          </Button>

          <Button className="w-full" onClick={() => handleVerifyOtp()} disabled={otp.length < 6}>
            {t("continue")} →
          </Button>
          <button
            onClick={() => setStep("contact")}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {t("changeNumber")}
          </button>
        </div>
      )}

      {/* ── Pay step ─────────────────────────────────────────────────────── */}
      {step === "pay" && (
        <div className="mt-8 space-y-5">
          {/* Name (optional) */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground">
              {t("nameLabel")} <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="name"
              type="text"
              placeholder={t("namePlaceholder")}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="mt-1.5"
            />
          </div>

          {/* Order summary */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold text-foreground">{t("orderSummary")}</h2>
            <FeeBreakdown
              className="mt-3"
              items={[
                ...(cart.passTypeName ? [{ label: `${cart.passTypeName} × ${cart.quantity}`, amountPaise: subtotal }] : []),
              ]}
              platformFeeLabel="ManharEvent platform fee"
              platformFeePaise={platformFee}
              platformFeeExplainer="ManharEvent's fee for running your event platform"
              gatewayFeeLabel="Payment gateway fee (Razorpay)"
              gatewayFeePaise={gatewayFee}
              gatewayFeeExplainer="Razorpay's fee for processing this payment — set by Razorpay, not ManharEvent"
              totalLabel="Total"
              totalPaise={total}
              locale={locale}
            />
            <p className="mt-3 text-xs text-muted-foreground">GST (18%) is included in the total above.</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 shrink-0 text-green-600" />
            <span>Secured by Razorpay. QR delivered instantly on payment.</span>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleMockPay}
            disabled={isPending}
          >
            {isPending ? t("processing") : t("payNow", { amount: totalFormatted })}
          </Button>

          <p className="text-center text-xs text-muted-foreground">{t("demoNote")}</p>
        </div>
      )}
    </div>
  );
}
