import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button, Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@manhar-garba/ui";
import { getEventBySlug } from "@manhar-garba/mock-data";
import { ChevronLeft } from "lucide-react";

const ALL_FAQS = [
  { q: "Can I get a refund?", a: "Full refund if cancelled 7 or more days before the event. 50% refund 3–7 days before. No refund within 3 days." },
  { q: "How do I receive my pass?", a: "Your QR pass appears immediately on screen after payment. It is also sent to your WhatsApp and SMS within 30 seconds." },
  { q: "Can I enter on individual nights with a Season pass?", a: "Yes — a Season pass is valid for all 9 nights. You choose which nights to attend." },
  { q: "Is re-entry allowed?", a: "Unlimited re-entry is allowed during gates-open hours." },
  { q: "What is the dress code?", a: "Each night has a theme. Check the individual night pages for the dress code. Dress code is enforced at the gate." },
  { q: "Can I transfer my pass to someone else?", a: "Yes — pass transfer is available in My Passes. The original QR is immediately invalidated." },
  { q: "What if my payment fails?", a: "Your pass selection is held for 15 minutes. You can retry with a different payment method. Your cart is preserved." },
  { q: "Is there a family pass?", a: "Yes — Couple and Family passes admit 2–6 people with a single QR. Check the pass types for the event." },
];

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string; eventSlug: string }>;
}) {
  const { locale, eventSlug } = await params;
  setRequestLocale(locale);

  const event = await getEventBySlug(eventSlug);
  if (!event) notFound();

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4 gap-1">
        <Link href={`/e/${eventSlug}`}>
          <ChevronLeft className="h-4 w-4" />
          Back to event
        </Link>
      </Button>

      <h1 className="font-display text-2xl font-bold text-foreground">Frequently Asked Questions</h1>
      <p className="mt-1 text-sm text-muted-foreground">{event.title}</p>

      <Accordion type="single" collapsible className="mt-6 w-full">
        {ALL_FAQS.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left text-sm font-medium">{faq.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-8 rounded-xl border border-border bg-surface p-5 text-sm">
        <p className="font-semibold text-foreground">Still have a question?</p>
        <p className="mt-1 text-muted-foreground">
          Our team is on WhatsApp. We respond within 2 hours during business hours.
        </p>
        <a
          href="https://wa.me/919876500000"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-primary hover:underline"
        >
          Chat on WhatsApp →
        </a>
      </div>
    </div>
  );
}
