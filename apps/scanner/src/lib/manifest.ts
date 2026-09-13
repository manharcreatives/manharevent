import { buildScanManifest } from "@manhar-garba/mock-data";
import { storeManifest, loadManifest, loadSettings } from "./db";
import type { ScanManifestEntry } from "@manhar-garba/mock-data";

const EVENT_ID = "ev-navratri-2026-ahmedabad";
const STALE_AFTER_MS = 18 * 60 * 60 * 1000; // 18 hours

export async function syncManifest(): Promise<{ entries: number; fromCache: boolean }> {
  const settings = await loadSettings();

  // Check staleness
  const loadedAt = settings.manifest_loaded_at ? new Date(settings.manifest_loaded_at).getTime() : 0;
  const age = Date.now() - loadedAt;
  if (loadedAt > 0 && age < STALE_AFTER_MS) {
    const cached = await loadManifest();
    if (cached.length > 0) return { entries: cached.length, fromCache: true };
  }

  // Fetch fresh manifest from mock-data (FE-07 handoff: from Supabase Edge Function)
  const entries = await buildScanManifest(EVENT_ID, settings.night_id);
  await storeManifest(entries);
  return { entries: entries.length, fromCache: false };
}

/** Forces a re-download even when the cached copy is still inside the stale window. */
export async function refreshManifest(): Promise<{ entries: number }> {
  const settings = await loadSettings();
  const entries = await buildScanManifest(EVENT_ID, settings.night_id);
  await storeManifest(entries);
  return { entries: entries.length };
}

export async function getManifest(): Promise<ScanManifestEntry[]> {
  const cached = await loadManifest();
  if (cached.length > 0) return cached;
  await syncManifest();
  return loadManifest();
}

export async function isManifestStale(): Promise<boolean> {
  const settings = await loadSettings();
  if (!settings.manifest_loaded_at) return true;
  const age = Date.now() - new Date(settings.manifest_loaded_at).getTime();
  return age > STALE_AFTER_MS;
}
