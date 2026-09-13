import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@manhar-garba/ui";
import { getGroupInvite } from "@manhar-garba/mock-data";
import { Link } from "@/i18n/navigation";
import { Users, LinkIcon, CalendarX2 } from "lucide-react";
import { JoinGroupForm } from "@/components/group/join-group-form";

export default async function GroupInvitePage({
  params,
}: {
  params: Promise<{ locale: string; groupInviteCode: string }>;
}) {
  const { locale, groupInviteCode } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("GroupInvite");

  // Looks the code up for real. This page used to print the code back and
  // send everyone to one hardcoded event, whatever link they'd opened.
  const invite = await getGroupInvite(groupInviteCode);

  if (!invite) {
    return (
      <div className="mx-auto max-w-[440px] px-4 py-16 text-center sm:px-6">
        <LinkIcon className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-4 font-display text-xl font-bold text-foreground">{t("notFound")}</h1>
        <p className="mt-2 font-mono text-sm text-muted-foreground">{groupInviteCode}</p>
        <Button asChild className="mt-6">
          <Link href="/">{t("viewEvent")}</Link>
        </Button>
      </div>
    );
  }

  const filled = invite.holders.length;

  return (
    <div className="mx-auto max-w-[440px] px-4 py-12 sm:px-6">
      <div className="text-center">
        {invite.expired ? (
          <CalendarX2 className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
        ) : (
          <Users className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
        )}
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
          {invite.expired ? t("expired") : t("title")}
        </h1>
        {!invite.expired && <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>}
        <p className="mt-1 text-sm text-muted-foreground">{t("invitedBy", { name: invite.createdByName })}</p>
      </div>

      <dl className="mt-6 space-y-2 rounded-xl border border-border bg-surface p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t("event")}</dt>
          <dd className="text-right font-medium text-foreground">{invite.event.title}</dd>
        </div>
        {invite.zone && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("zone")}</dt>
            <dd className="flex items-center gap-1.5 text-foreground">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: invite.zone.color ?? undefined }} />
              {invite.zone.name}
            </dd>
          </div>
        )}
        <div className="pt-2">
          <p className="text-xs text-muted-foreground">{t("progress", { filled, total: invite.spots })}</p>
          <div className="mt-1.5 flex gap-1.5">
            {Array.from({ length: invite.spots }).map((_, i) => (
              <div key={i} className={`h-2 flex-1 rounded-full ${i < filled ? "bg-primary" : "bg-surface-raised"}`} />
            ))}
          </div>
        </div>
      </dl>

      {invite.expired ? (
        <Button asChild variant="outline" className="mt-6 w-full">
          <Link href={`/e/${invite.event.slug}`}>{t("viewEvent")}</Link>
        </Button>
      ) : (
        <JoinGroupForm code={invite.code} full={filled >= invite.spots} eventSlug={invite.event.slug} />
      )}
    </div>
  );
}
