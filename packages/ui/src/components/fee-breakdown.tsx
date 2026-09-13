import * as React from "react";
import { Info } from "lucide-react";
import { cn } from "../lib/utils";
import { Money } from "./money";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";

export interface FeeBreakdownLineItem {
  label: string;
  amountPaise: number;
}

export interface FeeBreakdownProps extends React.HTMLAttributes<HTMLDListElement> {
  /** Pass / add-on line items, shown above the fee lines. */
  items: FeeBreakdownLineItem[];
  platformFeeLabel: string;
  platformFeePaise: number;
  platformFeeExplainer?: string;
  gatewayFeeLabel: string;
  gatewayFeePaise: number;
  gatewayFeeExplainer?: string;
  totalLabel: string;
  totalPaise: number;
  locale?: string;
}

/**
 * Always-expanded, two-line-item fee breakdown — never a single "convenience
 * fee" or a collapsed "other charges" line. Matches the copy template
 * introduced on the Surface-0 `/pricing` page (FE-08) so an organizer who
 * saw that page before registering sees the same two labels kept true here.
 */
export function FeeBreakdown({
  items,
  platformFeeLabel,
  platformFeePaise,
  platformFeeExplainer,
  gatewayFeeLabel,
  gatewayFeePaise,
  gatewayFeeExplainer,
  totalLabel,
  totalPaise,
  locale = "en-IN",
  className,
  ...props
}: FeeBreakdownProps) {
  return (
    <dl className={cn("space-y-1.5 text-sm", className)} {...props}>
      {items.map((item) => (
        <div key={item.label} className="flex justify-between">
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd><Money paise={item.amountPaise} locale={locale} /></dd>
        </div>
      ))}

      <FeeLine label={platformFeeLabel} amountPaise={platformFeePaise} explainer={platformFeeExplainer} locale={locale} />
      <FeeLine label={gatewayFeeLabel} amountPaise={gatewayFeePaise} explainer={gatewayFeeExplainer} locale={locale} />

      <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-bold">
        <dt>{totalLabel}</dt>
        <dd><Money paise={totalPaise} locale={locale} /></dd>
      </div>
    </dl>
  );
}

function FeeLine({
  label,
  amountPaise,
  explainer,
  locale,
}: {
  label: string;
  amountPaise: number;
  explainer?: string;
  locale: string;
}) {
  return (
    <div className="flex justify-between">
      <dt className="flex items-center gap-1 text-muted-foreground">
        {label}
        {explainer && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={`${label} — more info`}
                className="rounded-full text-muted-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Info className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="max-w-[240px] text-xs">{explainer}</PopoverContent>
          </Popover>
        )}
      </dt>
      <dd><Money paise={amountPaise} locale={locale} /></dd>
    </div>
  );
}
