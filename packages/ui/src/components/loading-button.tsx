"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "./ui/button";
import { cn } from "../lib/utils";

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
}

export function LoadingButton({ loading, disabled, children, className, ...props }: LoadingButtonProps) {
  return (
    <Button disabled={loading || disabled} className={cn("gap-2", className)} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}

