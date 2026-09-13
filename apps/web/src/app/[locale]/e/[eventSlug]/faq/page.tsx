import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button, Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@manhar-garba/ui";
import { DEFAULT_REFUND_TIERS, describeRefundTier } from "@manhar-garba/domain";
import { getEventBySlug, getEventContent, getTenantBySlug } from "@manhar-garba/mock-data";
import { ChevronLeft, MessageCircle } from "lucide-react";

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string; eventSlug: string }>;
}) {
  const { locale, eventSlug } = await params;
  setRequestLocale(locale);

  const event = await getEventBySlug(eventSlug);
  if (!event) notFound();

  const [content, tenant] = await Promise.all([getEventContent(event.id), getTenantBySlug("manhar")]);

  // Built from the shared tiers. The old hardcoded answer promised a full
  // refund at 7+ days, which matched neither the legal page nor the quote a
  // buyer actually got.
  const refundAnswer =
    DEFAULT_REFUND_TIERS.map((t) => `${describeRefundTier(t)} the first night: ${t.percent === 0 ? "no refund" : `${t.percent}%`}.`).join(" ") +
    " Refunds are on the pass price; platform and gateway fees aren't refundable. Request one from My Refunds.";

  const faqs = [...(content?.faqs ?? []), { q: "Can I get a refund?", a: refundAnswer }];
  const whatsapp = (tenant?.support_phone ?? "").replace(/\D/g, "");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4 gap-1">
        <Link href={`/e/${eventSlug}`}>
          <ChevronLeft className="h-4 w-4" />
          Back to event
        </Link>
      </Button>

      <h1 className="font-display text-2xl font-bold text-foreground">Frequently asked questions</h1>
      <p className="mt-1 text-sm text-muted-foreground">{event.title}</p>

      <Accordion type="single" collapsible className="mt-6 w-full">
        {faqs.map((faq, i) => (
          <AccordionItem key={faq.q} value={`faq-${i}`}>
            <AccordionTrigger className="text-left text-sm font-medium">{faq.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-8 rounded-xl border border-border bg-surface p-5 text-sm">
        <p className="font-semibold text-foreground">Still have a question?</p>
        <p className="mt-1 text-muted-foreground">{tenant?.display_name ?? "The organizer"} answers on WhatsApp.</p>
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi, I have a question about ${event.title}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
          >
            <MessageCircle className="h-4 w-4" />
            Chat on WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
