"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { PassCard, Button } from "@manhar-garba/ui";
import { Link } from "@/i18n/navigation";
import { getPass } from "@manhar-garba/mock-data";
import type { Pass } from "@manhar-garba/domain";
import { ChevronLeft } from "lucide-react";

export default function PassDetailPage({
  params,
}: {
  params: Promise<{ locale: string; passId: string }>;
}) {
  const { passId } = use(params);
  const [pass, setPass] = useState<Pass | null | undefined>(undefined);

  useEffect(() => {
    getPass(passId).then(setPass);
  }, [passId]);

  if (pass === undefined) return <p className="p-8 text-sm text-muted-foreground">Loading…</p>;
  if (pass === null) notFound();

  return (
    <div className="mx-auto max-w-[480px] px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-6 gap-1">
        <Link href="/me/passes">
          <ChevronLeft className="h-4 w-4" />
          My Passes
        </Link>
      </Button>

      <PassCard
        state={
          pass.status === "active" ? "valid"
          : pass.status === "used_up" ? "used-tonight"
          : pass.status === "refunded" || pass.status === "cancelled" ? "refunded"
          : pass.status === "transferred" ? "transferred-away"
          : "valid"
        }
        holderName="Guest"
        zoneName="Zone"
        zoneColor="#6366f1"
        admits={pass.admits}
        nightRange={`${pass.night_ids.length} night${pass.night_ids.length !== 1 ? "s" : ""}`}
        passCode={pass.pass_code}
      />

      {/* QR */}
      <div className="mt-6 flex flex-col items-center">
        <div className="h-48 w-48 rounded-xl border-2 border-primary bg-white p-2">
          <div
            className="h-full w-full rounded-lg bg-foreground/90"
            style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,white 3px,white 4px),repeating-linear-gradient(90deg,transparent,transparent 3px,white 3px,white 4px)" }}
            role="img"
            aria-label="QR code"
          />
        </div>
        <p className="mt-2 font-mono text-sm font-bold text-foreground">{pass.pass_code}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Show at gate — re-entry unlimited</p>
      </div>

      <dl className="mt-6 space-y-2 rounded-xl border border-border bg-surface p-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Status</dt>
          <dd className="capitalize text-foreground">{pass.status.replace("_", " ")}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Admits</dt>
          <dd className="text-foreground">{pass.admits}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Nights covered</dt>
          <dd className="text-foreground">{pass.night_ids.length}</dd>
        </div>
      </dl>
    </div>
  );
}
