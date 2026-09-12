import * as React from "react";
import { cn } from "../lib/utils";

interface MoneyProps extends React.HTMLAttributes<HTMLSpanElement> {
  paise: number;
  locale?: string;
  currency?: string;
  showSymbol?: boolean;
}

export function Money({ paise, locale = "en-IN", currency = "INR", showSymbol = true, className, ...props }: MoneyProps) {
  const rupees = paise / 100;
  const formatted = new Intl.NumberFormat(locale, {
    style: showSymbol ? "currency" : "decimal",
    currency,
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(rupees);

  return (
    <span className={cn("tabular-nums", className)} {...props}>
      {formatted}
    </span>
  );
}

