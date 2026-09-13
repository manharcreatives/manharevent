"use client";

import { use, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { notFound } from "next/navigation";
import { PassCard, Button, QrCode, QrDownloadButton } from "@manhar-garba/ui";
import { Link } from "@/i18n/navigation";
import { getPass, zones as allZones, passTypes as allPassTypes } from "@manhar-garba/mock-data";
import type { Pass } from "@manhar-garba/domain";
import { ChevronLeft, Download, Users, Moon, ShieldCheck } from "lucide-react";

export default function PassDetailPage({
  params,
}: {
  params: Promise<{ locale: string; passId: string }>;
}) {
  const t = useTranslations("Me");
  const tBook = useTranslations("Book");
  const tCommon = useTranslations("Common");
  const { passId } = use(params);
  const [pass, setPass] = useState<Pass | null | undefined>(undefined);

  useEffect(() => {
    getPass(passId).then(setPass);
  }, [passId]);

  if (pass === undefined) {
    return <p className="p-8 text-sm text-muted-foreground">{tCommon("loading")}</p>;
  }
  if (pass === null) notFound();

  const zone = allZones.find((z) => z.id === pass.zone_id);
  const passType = allPassTypes.find((pt) => pt.id === pass.pass_type_id);
  const scannable = pass.status === "active";

  return (
    <div className="mx-auto max-w-[480px] px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-6 gap-1">
        <Link href="/me/passes">
          <ChevronLeft className="h-4 w-4" />
          {t("passes")}
        </Link>
      </Button>

      <PassCard
        state={
          pass.status === "active"
            ? "valid"
            : pass.status === "used_up"
              ? "used-tonight"
              : pass.status === "refunded" || pass.status === "cancelled"
                ? "refunded"
                : pass.status === "transferred"
                  ? "transferred-away"
                  : "valid"
        }
        holderName="Guest"
        zoneName={zone?.name ?? "Zone"}
        zoneColor={zone?.color ?? "#6366f1"}
        admits={pass.admits}
        nightRange={tBook("nightsCovered", { count: pass.night_ids.length })}
        passCode={pass.pass_code}
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
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            {t("gateHint")}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-destructive">
            {t("passNotAdmitted", { status: pass.status.replace(/_/g, " ") })}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <QrDownloadButton
            value={pass.qr_payload}
            filename={`${pass.pass_code}.png`}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-foreground transition-colors hover:bg-surface-raised"
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
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("fieldZone")}</dt>
            <dd className="flex items-center gap-1.5 text-foreground">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: zone.color ?? undefined }}
              />
              {zone.name}
            </dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {t("fieldAdmits")}
          </dt>
          <dd className="text-foreground">
            {t("admitsPeople", { count: pass.admits })}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <Moon className="h-3.5 w-3.5" />
            {t("fieldNights")}
          </dt>
          <dd className="text-foreground">{pass.night_ids.length}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{t("fieldStatus")}</dt>
          <dd className="capitalize text-foreground">{pass.status.replace(/_/g, " ")}</dd>
        </div>
      </dl>
    </div>
  );
}
