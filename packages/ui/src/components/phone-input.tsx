"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { Input } from "./ui/input";

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: string;
  onChange?: (value: string) => void;
  countryCode?: string;
}

export function PhoneInput({ value = "", onChange, countryCode = "+91", className, ...props }: PhoneInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    onChange?.(digits);
  }

  return (
    <div className="flex">
      <span className="flex items-center rounded-l border border-r-0 border-border bg-surface-raised px-3 text-sm text-muted-foreground">
        {countryCode}
      </span>
      <Input
        type="tel"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        className={cn("rounded-l-none", className)}
        placeholder="98765 43210"
        {...props}
      />
    </div>
  );
}

