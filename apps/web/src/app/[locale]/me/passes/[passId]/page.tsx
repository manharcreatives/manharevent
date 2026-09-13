"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { PassCard, Button, QrCode, QrDownloadButton, Skeleton } from "@manhar-garba/ui";
import { Link } from "@/i18n/navigation";
import { getPass, zones as allZones, passTypes as allPassTypes } from "@manhar-garba/mock-data";
import type { Pass } from "@manhar-garba/domain";
import { ChevronLeft, Download, Users, Moon, ShieldCheck } from "lucide-react";

/** Maps a domain pass status onto the PassCard's visual state. */
function cardState(status: Pass["status"]) {
  switch (status) {
    case "used_up":
      return "used-tonight" as const;
    case "refunded":
    case "cancelled":
      return "refunded" as const;
    case "transferred":
      return "transferred-away" as const;
    default:
      return "valid" as const;
  }
}

export default function PassDetailPage({
  params,
}: {
  params: Promise<{ locale: string; passId: string }>;
}) {
  const { passId } = use(params);
  const t = useTranslations("Me");
  const [pass, setPass] = useState<Pass | null | undefined>(undefined);

  useEffect(() => {
    getPass(passId).then(setPass);
  }, [passId]);

  // Skeleton mirrors the real layout (card, QR, detail rows) so the page does
  // not jump when the pass resolves — this screen is opened at a gate, often on
  // a bad connection, and a shifting layout costs the holder seconds.
  if (pass === undefined) {
    return (
      <div className="mx-auto max-w-[480px] px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-6 h-48 w-full rounded-2xl" />
        <Skeleton className="mx-auto mt-6 h-52 w-52 rounded-xl" />
        <Skeleton className="mt-6 h-40 w-full rounded-xl" />
        <span className="sr-only">{t("passDetailTitle")}</span>
      </div>
    );
  }
  if (pass === null) notFound();

  const zone = allZones.find((z) => z.id === pass.zone_id);
  const passType = allPassTypes.find((pt) => pt.id === pass.pass_type_id);
  const scannable = pass.status === "active";
  const readableStatus = pass.status.replace(/_/g, " ");

  return (
    <div className="mx-auto max-w-[480px] px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-5 gap-1">
        <Link href="/me/passes">
          <ChevronLeft className="h-4 w-4" />
          {t("backToPasses")}
        </Link>
      </Button>

      <h1 className="mb-5 font-display text-xl font-bold text-foreground">
        {t("passDetailTitle")}
      </h1>

      <PassCard
        state={cardState(pass.status)}
        holderName={t("guest")}
        zoneName={zone?.name ?? t("fieldZone")}
        zoneColor={zone?.color ?? "#6366f1"}
        admits={pass.admits}
        nightRange={t("passesCount", { count: pass.night_ids.length })}
        passCode={pass.pass_code}
        admitsLabel={t("admitsShort", { count: pass.admits })}
        transferredLabel={t("transferredPass")}
      />

      {/*
        The real, scannable code — this exact string is what the gate scanner
        decodes and validates, so what's on screen here is what gets someone in.
      */}
      <div className="mt-6 flex flex-col items-center">
        <QrCode
          value={pass.qr_payload}
          size={208}
          level="H"
          caption={pass.pass_code}
          className={scannable ? "" : "opacity-40 grayscale"}
        />

        {scannable ? (
          <p className="mt-1.5 flex items-center gap-1.5 text-center text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" />
            {t("gateHint")}
          </p>
        ) : (
          <p className="mt-1.5 text-center text-xs text-destructive">
            {t("passNotAdmitted", { status: readableStatus })}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <QrDownloadButton
            value={pass.qr_payload}
            filename={`${pass.pass_code}.png`}
            className="inline-flex h-11 items-center gap-1.5 rounded-md border border-border px-4 text-sm text-foreground transition-colors hover:bg-surface-raised"
          >
            <Download className="h-4 w-4" />
            {t("saveQr")}
          </QrDownloadButton>
        </div>
      </div>

      <dl className="mt-6 space-y-2.5 rounded-xl border border-border bg-surface p-4 text-sm">
        {passType && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("fieldPass")}</dt>
            <dd className="text-right text-foreground">{passType.name}</dd>
          </div>
        )}
        {zone && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("fieldZone")}</dt>
            <dd className="flex items-center gap-1.5 text-foreground">
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: zone.color ?? undefined }}
              />
              {zone.name}
            </dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {t("fieldAdmits")}
          </dt>
          <dd className="text-right text-foreground">
            {t("admitsPeople", { count: pass.admits })}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <Moon className="h-3.5 w-3.5" />
            {t("fieldNights")}
          </dt>
          <dd className="text-foreground">{pass.night_ids.length}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t("fieldStatus")}</dt>
          <dd className="capitalize text-foreground">{readableStatus}</dd>
        </div>
      </dl>
    </div>
  );
}
