"use client";

import { Globe, Lock, Download, MessageCircle, Instagram, ExternalLink, EyeOff, Eye } from "lucide-react";
import { Button, CopyableCode, QrCode, QrDownloadButton, toast } from "@manhar-garba/ui";
import { useDashboardStore } from "@/lib/dashboard-store";
import { useEventScope, publicEventUrl } from "@/lib/use-event";
import { PrePublishChecklist, usePrePublishChecks } from "@/components/dashboard/pre-publish-checklist";

export default function PublishPage() {
  const { event, unlisted } = useEventScope();
  const setEventStatus = useDashboardStore((s) => s.setEventStatus);
  const setEventUnlisted = useDashboardStore((s) => s.setEventUnlisted);
  const { blockingFailed } = usePrePublishChecks();

  if (!event) return null;

  // Status lives in the store now, not in this page's useState — so the events
  // list, the overview chip and the sidebar all agree after a publish.
  const published = event.status === "published";
  const publicUrl = publicEventUrl(event.slug);

  function togglePublish() {
    if (!event) return;
    if (!published && blockingFailed > 0) {
      toast.error("Fix the blocking checklist items first");
      return;
    }
    setEventStatus(event.id, published ? "draft" : "published");
    toast.success(published ? "Event unpublished" : "Event is live", {
      description: published ? "The booking page is no longer reachable." : "Anyone with the link can now buy passes.",
    });
  }

  const whatsappText = encodeURIComponent(`${event.title} — book your passes\n\n${publicUrl}`);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-xl font-bold text-foreground">Publish &amp; share</h1>

      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {published ? <Globe className="h-5 w-5 text-success" /> : <Lock className="h-5 w-5 text-muted-foreground" />}
            <div>
              <p className="font-medium text-foreground">{published ? (unlisted ? "Live · unlisted" : "Live") : "Draft"}</p>
              <p className="text-xs text-muted-foreground">
                {published
                  ? "Your event is accepting bookings."
                  : blockingFailed > 0
                    ? `${blockingFailed} checklist item${blockingFailed > 1 ? "s" : ""} to fix before you can publish.`
                    : "Ready to go live."}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant={published ? "outline" : "primary"}
            onClick={togglePublish}
            disabled={!published && blockingFailed > 0}
          >
            {published ? "Unpublish" : "Publish now"}
          </Button>
        </div>

        {published && (
          <label className="mt-4 flex cursor-pointer items-start gap-2.5 border-t border-border pt-3">
            <input
              type="checkbox"
              checked={unlisted}
              onChange={(e) => setEventUnlisted(event.id, e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border"
            />
            <span className="text-sm">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                {unlisted ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                Unlisted — link only
              </span>
              <span className="text-xs text-muted-foreground">
                The page works for anyone you send the link to, but isn&rsquo;t listed on your site&rsquo;s home page. Good
                for a soft launch.
              </span>
            </span>
          </label>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Pre-publish checklist</h2>
        <PrePublishChecklist />
      </div>

      {published ? (
        <div className="space-y-4 rounded-xl border border-border bg-surface p-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Share your event</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              One link and one QR. Put the QR on posters and the link in WhatsApp groups — both open the same booking page.
            </p>
          </div>

          <CopyableCode value={publicUrl} label="Public link" />

          <div className="flex flex-wrap gap-2">
            <a
              href={`https://wa.me/?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-foreground transition-colors hover:bg-surface-raised"
            >
              <MessageCircle className="h-4 w-4" />
              Share on WhatsApp
            </a>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(`${event.title} 🪔\nBook your passes: ${publicUrl}`);
                toast.success("Caption copied", { description: "Paste it into your Instagram bio or story link." });
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-foreground transition-colors hover:bg-surface-raised"
            >
              <Instagram className="h-4 w-4" />
              Copy Instagram caption
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-foreground transition-colors hover:bg-surface-raised"
            >
              <ExternalLink className="h-4 w-4" />
              Open the page
            </a>
          </div>

          <div className="flex flex-col items-center border-t border-border pt-4">
            <QrCode value={publicUrl} size={176} level="H" />
            <QrDownloadButton
              value={publicUrl}
              filename={`${event.slug}-qr.png`}
              className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-foreground transition-colors hover:bg-surface-raised"
            >
              <Download className="h-4 w-4" />
              Download QR for print
            </QrDownloadButton>
            <p className="mt-2 max-w-xs text-center text-xs text-muted-foreground">
              1024px with high error correction, so it still scans off a printed poster.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">Your share link and QR code appear here once the event is published.</p>
        </div>
      )}
    </div>
  );
}
