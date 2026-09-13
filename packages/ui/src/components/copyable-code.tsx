"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "../lib/utils";

interface CopyableCodeProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  label?: string;
}

export function CopyableCode({ value, label, className, ...props }: CopyableCodeProps) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded border border-border bg-surface px-3 py-2",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        {label && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>}
        <code className="truncate font-mono text-sm text-foreground">{value}</code>
      </div>
      <button
        onClick={handleCopy}
        className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
        aria-label="Copy to clipboard"
      >
        {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

