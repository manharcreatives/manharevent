"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@manhar-garba/ui";

/**
 * There is no backend behind the buy flow yet, and a client clicking through
 * the demo must never wait on an SMS that will not arrive. Every bypassed step
 * says so in the same voice, in the viewer's language — the honest alternative
 * to a screen that silently accepts anything.
 */
export function DemoNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-3">
      <Badge variant="warning" className="shrink-0">
        <DemoBadgeLabel />
      </Badge>
      <p className="text-xs leading-relaxed text-foreground">{children}</p>
    </div>
  );
}

function DemoBadgeLabel() {
  const t = useTranslations("Common");
  return <>{t("demoBadge")}</>;
}
