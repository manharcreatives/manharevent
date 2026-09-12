"use client";

import { useRouter } from "next/navigation";
import { Onboarding } from "@/components/scanner/Onboarding";
import { saveSettings } from "@/lib/db";

export default function OnboardingPage() {
  const router = useRouter();

  async function handleDone() {
    await saveSettings({ onboarding_done: true });
    router.replace("/scan");
  }

  return <Onboarding onDone={handleDone} />;
}
