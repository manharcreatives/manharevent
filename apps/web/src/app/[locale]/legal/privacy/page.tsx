import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getTenantBySlug } from "@manhar-garba/mock-data";

// Legal pages are server components — no interactivity needed, and search
// engines/organizers should be able to load them without JS. The "Legal"
// i18n namespace only ever had the chrome labels (title/lastUpdated), never
// document bodies, so the body text below is starter/example policy
// content in English only (see docs/PROGRESS.md's FE-11 decision-log note
// on why legal-document bodies are not machine-translated three ways) —
// it should be reviewed by Manhar Creatives' own counsel before this goes
// live, same as any other launch-blocking legal content. Closes the 404
// gap linked from the footer on every page (FE-11).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal");
  return { title: t("privacy") };
}

const LAST_UPDATED = "2026-09-12";

export default async function PrivacyPolicyPage() {
  const t = await getTranslations("Legal");
  const tenant = await getTenantBySlug("manhar");
  const orgName = tenant?.legal_name ?? "Manhar Events Pvt. Ltd.";
  const supportEmail = tenant?.support_email ?? "support@manharevent.com";

  return (
    <div className="mx-auto max-w-[720px] px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-foreground">{t("privacy")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("lastUpdated")}: {new Date(LAST_UPDATED).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground">
        <p>
          {orgName} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates ManharEvent, the ticketing platform used to sell and manage passes for
          events organized on this domain. This policy explains what information we collect from you when you buy a
          pass or use a pass at the gate, and how we use it.
        </p>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Information we collect</h2>
          <p className="mt-2">
            To issue and deliver a pass we collect your mobile number, and optionally your name and email. We record
            order and payment details (via our payment partner Razorpay) for the passes you buy. At the gate, your
            pass code and scan time are recorded to validate entry and prevent duplicate use — this does not require
            any additional personal information beyond what the pass itself carries.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">How we use it</h2>
          <p className="mt-2">
            We use your mobile number to deliver your pass (via WhatsApp/SMS), send order confirmations and event
            updates, and to look up your passes and orders when you sign in. We do not sell your personal information
            to third parties. Payment details are processed directly by Razorpay under its own security and privacy
            standards — we do not store your card or UPI credentials.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Sharing with the event organizer</h2>
          <p className="mt-2">
            Because each event on ManharEvent is run by its own organizer, the organizer you buy a pass from can see
            your name, phone number, and order/attendance details for their own event, for the purpose of running
            that event and providing you support.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Your choices</h2>
          <p className="mt-2">
            You can ask us to correct your name/email on file, or to delete your account, by contacting{" "}
            <a href={`mailto:${supportEmail}`} className="underline">{supportEmail}</a>. Deleting your account does
            not invalidate passes you have already been issued for events you are still attending.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Contact</h2>
          <p className="mt-2">
            Questions about this policy can be sent to{" "}
            <a href={`mailto:${supportEmail}`} className="underline">{supportEmail}</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
