import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getTenantBySlug } from "@manhar-garba/mock-data";
import { DEFAULT_REFUND_TIERS, describeRefundTier } from "@manhar-garba/domain";
import { Link } from "@/i18n/navigation";

// See privacy/page.tsx's file-level comment — same rationale applies here:
// server component, English-only starter legal content pending real
// counsel review, chrome-only translation via the "Legal" namespace. The
// specific tiers below are illustrative defaults; P-07 ("Pricing & Policy")
// is where a real per-event refund-policy builder + evaluator + snapshot
// lands (03-architecture/data-model.md's refunds.policy_snapshot exists
// for exactly this) — until then, every event effectively uses this one
// page's policy.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal");
  return { title: t("refundPolicy") };
}

const LAST_UPDATED = "2026-09-12";

export default async function RefundPolicyPage() {
  const t = await getTranslations("Legal");
  const tenant = await getTenantBySlug("manhar");
  const supportEmail = tenant?.support_email ?? "support@manharevent.com";

  return (
    <div className="mx-auto max-w-[720px] px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-foreground">{t("refundPolicy")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("lastUpdated")}: {new Date(LAST_UPDATED).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground">
        <p>
          Unless a specific event&rsquo;s page states a different policy, the following default tiers apply to passes
          bought on ManharEvent, measured against the first night the pass covers:
        </p>

        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface">
              <tr>
                <th className="px-4 py-2.5 font-semibold text-foreground">When you cancel</th>
                <th className="px-4 py-2.5 font-semibold text-foreground">Refund</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Rendered from the same tiers the refund quote and the organizer's
                  policy editor use — these rows used to be typed in by hand and
                  disagreed with both. */}
              {DEFAULT_REFUND_TIERS.map((tier) => (
                <tr key={tier.minDaysBefore}>
                  <td className="px-4 py-2.5 text-muted-foreground">{describeRefundTier(tier)} the first covered night</td>
                  <td className="px-4 py-2.5 text-foreground">
                    {tier.percent === 0 ? "Not refundable" : `${tier.percent}% of the pass price`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground">
          Refunds are calculated on the pass price. The platform fee and the payment gateway fee are not refundable —
          the gateway keeps its charge on a reversed payment regardless.
        </p>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">How to request a refund</h2>
          <p className="mt-2">
            Sign in and open <Link href="/me/passes" className="underline">My Passes</Link>, or write to{" "}
            <a href={`mailto:${supportEmail}`} className="underline">{supportEmail}</a> with your order number.
            Approved refunds are returned to the original payment method within 5–7 business days.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Event cancellation or postponement</h2>
          <p className="mt-2">
            If an organizer cancels an event outright, all passes for it are refunded in full, including fees. If an
            event is postponed, your pass remains valid for the new date; a full refund is available if you cannot
            attend the new date.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Non-refundable situations</h2>
          <p className="mt-2">
            Passes already checked in (used) at the gate, and passes reported lost, stolen, or shared, are not
            eligible for a refund.
          </p>
        </section>
      </div>
    </div>
  );
}
