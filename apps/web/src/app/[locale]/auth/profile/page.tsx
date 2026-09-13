"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Field, Input } from "@manhar-garba/ui";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "@/i18n/navigation";

export default function AuthProfilePage() {
  const t = useTranslations("Auth");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const { phone, setName, confirmPhone } = useAuthStore();
  const [nameInput, setNameInput] = useState("");

  function finish(name?: string) {
    // Skipping the name still leaves a signed-in session — the number is what
    // identifies the buyer. Previously "Skip for now" dropped the visitor into
    // /me without ever setting `isAuthenticated`.
    if (name?.trim()) setName(name.trim());
    else if (phone) confirmPhone(phone);
    router.push("/me/passes");
  }

  return (
    <div className="mx-auto max-w-[420px] px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("nameLabel")}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("profileSubtitle")}</p>

      <div className="mt-6 space-y-4">
        <Field label={t("nameLabel")} htmlFor="name">
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder={t("namePlaceholder")}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") finish(nameInput); }}
          />
        </Field>

        <Button className="w-full" onClick={() => finish(nameInput)}>
          {t("save")} →
        </Button>

        <button
          type="button"
          onClick={() => finish()}
          className="min-h-11 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {tCommon("skipForNow")}
        </button>
      </div>
    </div>
  );
}
