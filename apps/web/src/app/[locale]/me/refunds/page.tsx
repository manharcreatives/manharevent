import { setRequestLocale } from "next-intl/server";

export default async function RefundsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">Refunds</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Refund requests are processed within 5–7 business days. Contact us on WhatsApp for help.
      </p>
      <a
        href="https://wa.me/919876500000"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block text-sm text-primary hover:underline"
      >
        Contact support →
      </a>
    </div>
  );
}
