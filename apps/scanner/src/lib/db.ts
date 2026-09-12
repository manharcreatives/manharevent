"use client";

import Dexie, { type Table } from "dexie";
import type { ScanManifestEntry } from "@manhar-garba/mock-data";

// ─── Table row types ──────────────────────────────────────────────────────────

export type { ScanManifestEntry };

export interface QueueEntry {
  id?: number;
  client_uuid: string;
  pass_id: string;
  pass_code: string;
  direction: "in" | "out";
  result: "allowed" | "denied";
  denied_reason: string | null;
  gate_id: string | null;
  zone_id: string | null;
  night_id: string;
  scanned_at: string;
  device_id: string;
  synced: boolean;
}

export interface SessionLogEntry {
  id?: number;
  scanned_at: string;
  pass_code: string;
  verdict: string;
  holder_name: string | null;
  direction: "in" | "out";
  is_manual: boolean;
}

export interface ScannerSettings {
  id: 1;
  gate_id: string;
  gate_name: string;
  zone_id: string;
  zone_name: string;
  zone_color: string;
  night_id: string;
  night_label: string;
  device_id: string;
  manifest_version: number;
  manifest_loaded_at: string | null;
  onboarding_done: boolean;
}

// ─── Dexie DB ─────────────────────────────────────────────────────────────────

class ScannerDB extends Dexie {
  manifest!: Table<ScanManifestEntry & { id?: number }>;
  queue!: Table<QueueEntry>;
  sessionLog!: Table<SessionLogEntry>;
  settings!: Table<ScannerSettings>;

  constructor() {
    super("manhar-scanner");
    this.version(1).stores({
      manifest: "++id, pass_code, qr_payload, zone_id, status",
      queue: "++id, client_uuid, pass_code, synced, scanned_at",
      sessionLog: "++id, scanned_at, pass_code, verdict",
      settings: "id",
    });
  }
}

let _db: ScannerDB | null = null;

export function getDb(): ScannerDB {
  if (!_db) _db = new ScannerDB();
  return _db;
}

// ─── Settings helpers ─────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: ScannerSettings = {
  id: 1,
  gate_id: "gate-g2",
  gate_name: "Gate 2 — Gold North",
  zone_id: "zone-gold-001",
  zone_name: "Gold Zone",
  zone_color: "hsl(42 96% 58%)",
  night_id: "night-05",
  night_label: "Night 5",
  device_id: "",
  manifest_version: 0,
  manifest_loaded_at: null,
  onboarding_done: false,
};

export async function loadSettings(): Promise<ScannerSettings> {
  const db = getDb();
  const s = await db.settings.get(1);
  return s ?? DEFAULT_SETTINGS;
}

export async function saveSettings(partial: Partial<ScannerSettings>): Promise<void> {
  const db = getDb();
  const current = await loadSettings();
  await db.settings.put({ ...current, ...partial, id: 1 });
}

// ─── Manifest helpers ─────────────────────────────────────────────────────────

export async function loadManifest(): Promise<ScanManifestEntry[]> {
  const db = getDb();
  return db.manifest.toArray();
}

export async function storeManifest(entries: ScanManifestEntry[]): Promise<void> {
  const db = getDb();
  await db.manifest.clear();
  await db.manifest.bulkAdd(entries as (ScanManifestEntry & { id?: number })[]);
  await saveSettings({ manifest_version: Date.now(), manifest_loaded_at: new Date().toISOString() });
}

export async function incrementTonightCount(passCode: string): Promise<void> {
  const db = getDb();
  const entry = await db.manifest.where("pass_code").equals(passCode).first();
  if (entry?.id != null) {
    await db.manifest.update(entry.id, {
      tonight_checkin_count: (entry.tonight_checkin_count ?? 0) + 1,
    });
  }
}

// ─── Queue helpers ────────────────────────────────────────────────────────────

export async function enqueueCheckIn(entry: Omit<QueueEntry, "id">): Promise<void> {
  await getDb().queue.add(entry);
}

export async function getPendingQueue(): Promise<QueueEntry[]> {
  return getDb().queue.where("synced").equals(0).toArray();
}

export async function markSynced(ids: number[]): Promise<void> {
  const db = getDb();
  await Promise.all(ids.map((id) => db.queue.update(id, { synced: true })));
}

// ─── Session log helpers ──────────────────────────────────────────────────────

export async function logScan(entry: Omit<SessionLogEntry, "id">): Promise<void> {
  await getDb().sessionLog.add(entry);
}

export async function getSessionLog(): Promise<SessionLogEntry[]> {
  return getDb().sessionLog.orderBy("scanned_at").reverse().toArray();
}
