import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { listArtists } from "@manhar-garba/mock-data";
import { Button } from "@manhar-garba/ui";
import { Link } from "@/i18n/navigation";
import { ChevronLeft, Instagram, Youtube } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; artistSlug: string }>;
}): Promise<Metadata> {
  const { artistSlug } = await params;
  const artists = await listArtists("tenant-manhar-001");
  const artist = artists.find((a) => a.slug === artistSlug);
  if (!artist) return {};
  return { title: `${artist.name} — Manharevents` };
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ locale: string; artistSlug: string }>;
}) {
  const { locale, artistSlug } = await params;
  setRequestLocale(locale);

  const artists = await listArtists("tenant-manhar-001");
  const artist = artists.find((a) => a.slug === artistSlug);
  if (!artist) notFound();

  return (
    <div className="mx-auto max-w-[640px] px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-6 gap-1">
        <Link href="/">
          <ChevronLeft className="h-4 w-4" />
          Home
        </Link>
      </Button>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-surface-raised text-2xl font-bold text-muted-foreground">
          {artist.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold text-foreground">{artist.name}</h1>
          {artist.bio && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{artist.bio}</p>
          )}
          <div className="mt-4 flex gap-3">
            {artist.instagram && (
              <a
                href={`https://instagram.com/${artist.instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <Instagram className="h-4 w-4" />
                {artist.instagram}
              </a>
            )}
            {artist.youtube && (
              <a
                href={artist.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <Youtube className="h-4 w-4" />
                YouTube
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl font-bold text-foreground">Performing at</h2>
        <div className="mt-4 rounded-xl border border-border bg-surface p-4">
          <p className="font-semibold text-foreground">Manhar Navratri 2026</p>
          <p className="mt-1 text-sm text-muted-foreground">2–10 October 2026 · Sardar Patel Ground, Ahmedabad</p>
          <Button asChild size="sm" className="mt-3">
            <Link href="/e/manhar-navratri-2026">View event →</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
