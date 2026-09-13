"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Button, Input } from "@manhar-garba/ui";
import { Link, useRouter } from "@/i18n/navigation";
import { joinGroupAction } from "@/app/actions/group";

export function JoinGroupForm({ code, full, eventSlug }: { code: string; full: boolean; eventSlug: string }) {
  const t = useTranslations("GroupInvite");
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [pending, startTransition] = useTransition();

  if (joined) {
    return (
      <div className="mt-6 rounded-xl border border-success/40 bg-success/10 p-5 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
        <p className="mt-2 text-sm font-medium text-foreground">{t("thankYou")}</p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href={`/e/${eventSlug}`}>{t("viewEvent")}</Link>
        </Button>
      </div>
    );
  }

  if (full) {
    return (
      <div className="mt-6 space-y-3 text-center">
        <p className="text-sm text-muted-foreground">{t("joinError")}</p>
        <Button asChild className="w-full">
          <Link href={`/e/${eventSlug}/book`}>{t("viewEvent")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await joinGroupAction(code, name, phone);
          if (result.ok) {
            setJoined(true);
            router.refresh(); // re-read the filled-spots bar from the server
          } else {
            setError(result.reason === "invalid_phone" ? t("invalidPhone") : t("joinError"));
          }
        });
      }}
    >
      <div>
        <label htmlFor="gi-name" className="block text-sm font-medium text-foreground">{t("nameLabel")}</label>
        <Input id="gi-name" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} autoComplete="name" />
      </div>
      <div>
        <label htmlFor="gi-phone" className="block text-sm font-medium text-foreground">{t("phoneLabel")}</label>
        <Input id="gi-phone" className="mt-1.5" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("phonePlaceholder")} inputMode="tel" autoComplete="tel" />
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending || name.trim().length < 2 || phone.replace(/\D/g, "").length < 10}>
        {t("submit")}
      </Button>
    </form>
  );
}
