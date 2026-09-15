import { getTranslations } from "next-intl/server";
import { Shield, MessageCircle } from "lucide-react";

interface TrustStripProps {
  /** E.164 support number, e.g. "+919876543210" — from the tenant fixture (packages/mock-data), the one place this number is defined. */
  supportPhone: string;
}

export async function TrustStrip({ supportPhone }: TrustStripProps) {
  const t = await getTranslations("Event");

  return (
    <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <Shield className="h-3.5 w-3.5 text-success" aria-hidden="true" />
        {t("securedBy")}
      </span>
      <span>UPI · Cards · Net Banking · EMI</span>
      <a
        href={`https://wa.me/${supportPhone.replace(/^\+/, "")}`}
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
