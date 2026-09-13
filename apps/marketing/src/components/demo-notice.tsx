"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@manhar-garba/ui";

/**
 * There is no backend behind this funnel yet, and a client clicking through the
 * demo must never wait on an SMS that will not arrive. Every bypassed step says
 * so in the same voice, in the viewer's language.
 */
export function DemoNotice({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Common");

  return (
    <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-3">
      <Badge variant="warning" className="shrink-0">
        {t("demoBadge")}
      </Badge>
      <p className="text-xs leading-relaxed text-foreground">{children}</p>
    </div>
  );
}
