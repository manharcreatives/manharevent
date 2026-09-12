import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getTenantBySlug } from "@manhar-garba/mock-data";

// See privacy/page.tsx's file-level comment — same rationale applies here:
// server component, English-only starter legal content pending real
// counsel review, chrome-only translation via the "Legal" namespace.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal");
  return { title: t("terms") };
}

const LAST_UPDATED = "2026-09-12";

export default async function TermsOfServicePage() {
  const t = await getTranslations("Legal");
  const tenant = await getTenantBySlug("manhar");
  const orgName = tenant?.legal_name ?? "Manhar Events Pvt. Ltd.";
  const supportEmail = tenant?.support_email ?? "support@manharevent.com";
  const supportPhone = tenant?.support_phone ?? "+91 98765 43210";

  return (
    <div className="mx-auto max-w-[720px] px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-foreground">{t("terms")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("lastUpdated")}: {new Date(LAST_UPDATED).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground">
        <p>
          These terms govern your purchase and use of a pass through ManharEvent, operated by {orgName}. By buying or
          using a pass, you agree to them.
        </p>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">1. Passes</h2>
          <p className="mt-2">
            A pass admits the number of people, and covers the nights, printed on it. It is valid only for the event
            and zone it was issued for. Each pass carries a unique QR code and pass code — do not share a screenshot
            of your pass publicly, as anyone holding a valid, unused QR code can use it for entry.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">2. Fees</h2>
          <p className="mt-2">
            Every checkout shows the base price, ManharEvent's platform fee, and the payment gateway's processing
            fee as three separate line items, plus applicable GST — never bundled into one hidden "convenience fee".
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">3. Entry conditions</h2>
          <p className="mt-2">
            Entry is subject to the organizer's own dress code, re-entry policy, and venue rules for each event, shown
            on that event's page. The organizer or their gate staff may deny entry for a pass that fails validation,
            has already been used for the night, or is flagged as refunded, cancelled, or blocked.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">4. Refunds</h2>
          <p className="mt-2">
            Refunds are handled under the event's own refund policy — see our{" "}
            <a href="/legal/refund-policy" className="underline">Refund Policy</a>.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">5. Liability</h2>
          <p className="mt-2">
            ManharEvent is the ticketing platform; each event is organized, staffed, and run by its own independent
            organizer, who is responsible for the event itself. ManharEvent's role is limited to ticket sale,
            delivery, and gate validation.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">6. Contact</h2>
          <p className="mt-2">
            Questions about these terms: <a href={`mailto:${supportEmail}`} className="underline">{supportEmail}</a>{" "}
            or <a href={`tel:${supportPhone.replace(/\s/g, "")}`} className="underline">{supportPhone}</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
