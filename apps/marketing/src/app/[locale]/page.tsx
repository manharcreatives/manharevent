import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@manhar-garba/ui";
import { Globe, WifiOff, ShieldCheck, Globe2, LayoutDashboard, ScanLine } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Landing" });
  return {
    description: t("heroSubtitle"),
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Landing");

  const values = [
    { icon: Globe, title: t("value1Title"), desc: t("value1Desc") },
    { icon: WifiOff, title: t("value2Title"), desc: t("value2Desc") },
    { icon: ShieldCheck, title: t("value3Title"), desc: t("value3Desc") },
  ];

  const whatYouGet = [
    { icon: Globe2, title: t("whatYouGet1Title"), desc: t("whatYouGet1Desc") },
    { icon: LayoutDashboard, title: t("whatYouGet2Title"), desc: t("whatYouGet2Desc") },
    { icon: ScanLine, title: t("whatYouGet3Title"), desc: t("whatYouGet3Desc") },
  ];

  return (
    <>
      {/* Hero — single primary CTA, no search bar, no cross-organizer content */}
      <section className="relative overflow-hidden bg-background">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at 60% 40%, hsl(var(--primary)/0.4) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, hsl(var(--accent)/0.3) 0%, transparent 55%)",
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-[900px] flex-col items-center px-4 pb-16 pt-20 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">{t("heroEyebrow")}</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">{t("heroSubtitle")}</p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/register">{t("heroCta")}</Link>
          </Button>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-center font-display text-2xl font-bold text-foreground sm:text-3xl">
          {t("valueTitle")}
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {values.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border bg-surface p-6">
              <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
              <h3 className="mt-4 font-display text-lg font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What you get after approval */}
      <section className="bg-surface/40 py-14">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-display text-2xl font-bold text-foreground sm:text-3xl">
            {t("whatYouGetTitle")}
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {whatYouGet.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center rounded-xl border border-border bg-background p-6 text-center">
                <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
                <h3 className="mt-4 font-display text-base font-bold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-[900px] px-4 py-16 text-center sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">{t("finalCtaTitle")}</h2>
        <Button asChild size="lg" className="mt-6">
          <Link href="/register">{t("finalCta")}</Link>
        </Button>
      </section>
    </>
  );
}
