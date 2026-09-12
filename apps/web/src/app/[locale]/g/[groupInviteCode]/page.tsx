import { setRequestLocale } from "next-intl/server";
import { Button } from "@manhar-garba/ui";
import { Link } from "@/i18n/navigation";
import { Users } from "lucide-react";

export default async function GroupInvitePage({
  params,
}: {
  params: Promise<{ locale: string; groupInviteCode: string }>;
}) {
  const { locale, groupInviteCode } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-[480px] px-4 py-16 sm:px-6 text-center">
      <Users className="mx-auto h-14 w-14 text-primary" aria-hidden="true" />
      <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Group invite</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Code: <strong className="font-mono">{groupInviteCode}</strong>
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Your friend has invited you to join their group at Manhar Navratri 2026.
        Book a pass in the same zone and you&apos;ll be grouped automatically at the gate.
      </p>
      <Button asChild className="mt-6">
        <Link href="/e/manhar-navratri-2026/book">Book a pass →</Link>
      </Button>
    </div>
  );
}
