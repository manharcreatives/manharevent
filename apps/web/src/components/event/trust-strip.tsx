import { getTranslations } from "next-intl/server";
import { Shield, MessageCircle } from "lucide-react";

export async function TrustStrip() {
  const t = await getTranslations("Event");

  return (
    <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <Shield className="h-3.5 w-3.5 text-success" aria-hidden="true" />
        {t("securedBy")}
      </span>
      <span>UPI · Cards · Net Banking · EMI</span>
      <a
        href="https://wa.me/919876500000"
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto flex items-center gap-1.5 text-success hover:underline"
      >
        <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
        {t("whatsappSupport")}
      </a>
    </div>
  );
}
