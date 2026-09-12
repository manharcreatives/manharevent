"use client";

import * as React from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OtpInput({ length = 6, value, onChange, disabled }: OtpInputProps) {
  return (
    <InputOTP maxLength={length} value={value} onChange={onChange} disabled={disabled}>
      <InputOTPGroup>
        {Array.from({ length }, (_, i) => (
          <InputOTPSlot key={i} index={i} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}

