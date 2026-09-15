"use client";

import { useState } from "react";
import type { Event } from "@manhar-garba/domain";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  QrCode,
  QrDownloadButton,
  toast,
} from "@manhar-garba/ui";
import { Copy, Check, Download, MessageCircle } from "lucide-react";

const WEB_APP_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";

export function ShareEventDialog({
  event,
  onOpenChange,
}: {
  event: Pick<Event, "title" | "slug" | "starts_on" | "ends_on">;
  onOpenChange: (open: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  const link = `${WEB_APP_URL}/en/e/${event.slug}`;
  const message = `${event.title} — ${event.starts_on} to ${event.ends_on}. Book your pass: ${link}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select and copy the link manually.");
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share {event.title}</DialogTitle>
          <DialogDescription>
            Public link, QR code, and a pre-filled WhatsApp message — send any of these to your audience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Public link</p>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-2">
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">{link}</span>
              <button onClick={copyLink} aria-label="Copy link" className="shrink-0 text-muted-foreground hover:text-foreground">
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            {/* Honesty label — no fake claim of a production subdomain that doesn't exist yet. */}
            <p className="mt-1.5 text-xs text-muted-foreground">
              This is the local demo link. On a real launch, your event lives at your own subdomain
              (e.g. yourevent.manharevent.com) — that comes with the real backend phase.
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface-raised p-4">
            <QrCode value={link} size={160} level="M" />
            <QrDownloadButton
              value={link}
              filename={`${event.slug}-qr.png`}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-foreground transition-colors hover:bg-surface"
            >
              <Download className="h-3.5 w-3.5" />
              Download QR
            </QrDownloadButton>
          </div>

          <Button asChild className="w-full gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="h-4 w-4" />
              Share on WhatsApp
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
