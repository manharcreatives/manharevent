"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { Order, Pass } from "@manhar-garba/domain";
import { Button, Input, FeeBreakdown } from "@manhar-garba/ui";
import { useCartStore } from "@/lib/cart-store";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "@/i18n/navigation";
import { payMockOrder } from "@/app/actions/order";
import { Shield, Phone, MessageSquare } from "lucide-react";

type CheckoutStep = "contact" | "otp" | "pay";

interface Props {
  order: Order;
  existingPasses: Pass[];
}

export function CheckoutClient({ order }: Props) {
  const t = useTranslations("Checkout");
  const locale = useLocale();
  const router = useRouter();
  const cart = useCartStore();
  const { phone, name, setPhone, setName } = useAuthStore();

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
  // to set. Same two-line template as Surface 0's /pricing page (FE-08).
  const platformFee = Math.round(subtotal * 0.01);
  const gatewayFee = Math.round(subtotal * 0.02);
  const gst = Math.round((subtotal + platformFee + gatewayFee) * 0.18);
  const total = subtotal + platformFee + gatewayFee + gst;
  const totalFormatted = new Intl.NumberFormat(locale === "en" ? "en-IN" : `${locale}-IN`, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: total % 100 === 0 ? 0 : 2,
  }).format(total / 100);

  function handleSendOtp() {
    const cleaned = phoneInput.replace(/\s/g, "");
    if (!/^\+91\d{10}$/.test(cleaned) && !/^\d{10}$/.test(cleaned)) {
      setPhoneError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setPhoneError("");
    const normalised = cleaned.startsWith("+91") ? cleaned : `+91${cleaned}`;
    setPhone(normalised);
    setStep("otp");
  }

  function handleVerifyOtp() {
    // Mock: any 6-digit OTP passes
    if (otp.length < 4) return;
    setStep("pay");
  }

  function handleMockPay() {
    if (nameInput.trim()) setName(nameInput.trim());
    startTransition(async () => {
      // Mock payment — no real Razorpay call. If the cart carries a real
      // selection (the normal path, via /e/[slug]/book), issue passes now;
      // this is the mock stand-in for a verified payment webhook.
      if (cart.passTypeId && cart.zoneId) {
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
            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            Your QR pass will also be sent to this number on WhatsApp.
          </div>

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
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-foreground">
              {t("otpLabel")} <span className="text-muted-foreground text-xs">({t("demoNote")})</span>
            </label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder={t("otpPlaceholder")}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="mt-1.5 tracking-widest"
            />
          </div>
          <Button className="w-full" onClick={handleVerifyOtp} disabled={otp.length < 4}>
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
