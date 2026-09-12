"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Input } from "@manhar-garba/ui";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "@/i18n/navigation";

// FE-11: wired to the "Auth" i18n namespace — see auth/start's file comment.
export default function AuthProfilePage() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const { setName } = useAuthStore();
  const [nameInput, setNameInput] = useState("");

  function handleSave() {
    if (nameInput.trim()) setName(nameInput.trim());
    router.push("/me");
  }

  return (
    <div className="mx-auto max-w-[400px] px-4 py-16 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("nameLabel")}</h1>

      <div className="mt-8 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground">
            {t("nameLabel")}
          </label>
          <Input
            id="name"
            type="text"
            placeholder={t("namePlaceholder")}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="mt-1.5"
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
          />
        </div>

        <Button className="w-full" onClick={handleSave}>
          {t("save")} →
        </Button>
        <button
          onClick={() => router.push("/me")}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
