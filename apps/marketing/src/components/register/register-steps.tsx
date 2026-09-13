"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { cn } from "@manhar-garba/ui";

/** Three steps, named, so an organizer can see how much is left before they
 *  start typing — the funnel used to give no sense of length at all. */
export function RegisterSteps({ current }: { current: 1 | 2 | 3 }) {
  const t = useTranslations("Register");
  const labels = [t("stepPhone"), t("stepOtp"), t("stepDetails")];

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t("stepOf", { current, total: labels.length })}
      </p>
      <ol className="mt-2 flex items-center gap-2">
        {labels.map((label, i) => {
          const step = i + 1;
          const done = step < current;
          const active = step === current;
          return (
            <li key={label} className="flex flex-1 flex-col gap-1.5">
              <span
                className={cn(
                  "h-1 rounded-full",
                  done || active ? "bg-primary" : "bg-border"
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "flex items-center gap-1 text-[11px]",
                  active ? "font-semibold text-foreground" : "text-muted-foreground"
                )}
              >
                {done && <Check className="h-3 w-3 text-primary" aria-hidden="true" />}
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
