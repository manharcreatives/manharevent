"use client";

import Dexie, { type Table } from "dexie";
import type { ScanManifestEntry } from "@manhar-garba/mock-data";

// ─── Table row types ──────────────────────────────────────────────────────────

export type { ScanManifestEntry };

/** How the code reached the scanner. A manual entry skipped the QR signature. */
export type EntryMethod = "qr" | "manual";

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
  /** Gate-staff member who was signed in when this was scanned. */
  staff_id?: string;
  /**
   * IndexedDB cannot index a boolean — a row stored with `synced: false` is
   * simply absent from the `synced` index, which is how the pending queue used
   * to come back empty forever and nothing ever synced. Kept as 0 | 1.
   */
  synced: 0 | 1;
  /** Typed-in codes are unsigned; ops needs to be able to tell them apart. */
  entry_method: EntryMethod;
  /** Failed upload attempts, so a poison row can be shown rather than retried forever. */
  attempts: number;
  last_error: string | null;
}

export interface SessionLogEntry {
  id?: number;
  scanned_at: string;
  pass_code: string;
  verdict: string;
  holder_name: string | null;
  direction: "in" | "out";
  is_manual: boolean;
  /** Which night this scan belonged to, so last night's log can be pruned. */
  night_id?: string;
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

    // v2 — `synced` moves from boolean to 0|1 so it is actually indexable, and
    // queue rows gain the fields the sync loop needs to report failure. Phones
    // in the field are mid-shift when they update, so the old rows are migrated
    // rather than dropped: those are unsynced admits nobody else has a copy of.
    this.version(2)
      .stores({
        manifest: "++id, pass_code, qr_payload, zone_id, status",
        queue: "++id, client_uuid, pass_code, synced, scanned_at, night_id",
        sessionLog: "++id, scanned_at, pass_code, verdict, night_id",
        settings: "id",
      })
      .upgrade(async (tx) => {
        await tx
          .table<QueueEntry>("queue")
          .toCollection()
          .modify((row) => {
            row.synced = row.synced ? 1 : 0;
            row.entry_method ??= "qr";
            row.attempts ??= 0;
            row.last_error ??= null;
          });
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

/**
 * Replaces the manifest, preserving tonight's local admit counts.
 *
 * A re-sync mid-shift used to wipe `tonight_checkin_count` back to whatever the
 * server knew, which on a phone that has been offline for an hour is zero — and
 * every pass admitted in that hour would have admitted again. The local count is
 * the higher-water mark until the queue has actually flushed, so keep it.
 */
export async function storeManifest(entries: ScanManifestEntry[]): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.manifest, db.settings, async () => {
    const previous = await db.manifest.toArray();
    const localCounts = new Map(previous.map((e) => [e.pass_code, e.tonight_checkin_count ?? 0]));

    const merged = entries.map((e) => ({
      ...e,
      tonight_checkin_count: Math.max(e.tonight_checkin_count ?? 0, localCounts.get(e.pass_code) ?? 0),
    }));

    await db.manifest.clear();
    await db.manifest.bulkAdd(merged as (ScanManifestEntry & { id?: number })[]);
    const current = (await db.settings.get(1)) ?? DEFAULT_SETTINGS;
    await db.settings.put({
      ...current,
      id: 1,
      manifest_version: Date.now(),
      manifest_loaded_at: new Date().toISOString(),
    });
  });
}

/**
 * Atomically claims one admit and returns the count after the claim.
 *
 * Read-modify-write across two awaits used to let a double-tap on the manual
 * screen (or a camera decode landing on the same tick) both read count 0 and
 * both write 1 — a second person through the gate on a one-admit pass. The
 * whole claim happens inside one Dexie transaction so the loser sees the
 * winner's write.
 *
 * Returns `null` when the pass is not in the manifest, and the new count
 * otherwise; a caller that gets a count above `admits` must reject the scan.
 */
export async function claimAdmit(passCode: string): Promise<number | null> {
  const db = getDb();
  return db.transaction("rw", db.manifest, async () => {
    const entry = await db.manifest.where("pass_code").equals(passCode).first();
    if (!entry || entry.id == null) return null;
    const next = (entry.tonight_checkin_count ?? 0) + 1;
    await db.manifest.update(entry.id, { tonight_checkin_count: next });
    return next;
  });
}

/** Gives an admit back — used when a claim is made and the scan is then rejected. */
export async function releaseAdmit(passCode: string): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.manifest, async () => {
    const entry = await db.manifest.where("pass_code").equals(passCode).first();
    if (!entry || entry.id == null) return;
    await db.manifest.update(entry.id, {
      tonight_checkin_count: Math.max(0, (entry.tonight_checkin_count ?? 0) - 1),
    });
  });
}

// ─── Queue helpers ────────────────────────────────────────────────────────────

export async function enqueueCheckIn(entry: Omit<QueueEntry, "id">): Promise<void> {
  await getDb().queue.add(entry);
}

export async function getPendingQueue(): Promise<QueueEntry[]> {
  return getDb().queue.where("synced").equals(0).sortBy("scanned_at");
}

export async function countPending(): Promise<number> {
  return getDb().queue.where("synced").equals(0).count();
}

export async function markSynced(ids: number[]): Promise<void> {
  const db = getDb();
  await db.queue.where("id").anyOf(ids).modify({ synced: 1 });
}

export async function markFailed(id: number, message: string): Promise<void> {
  const db = getDb();
  const row = await db.queue.get(id);
  await db.queue.update(id, { attempts: (row?.attempts ?? 0) + 1, last_error: message });
}

// ─── Session log helpers ──────────────────────────────────────────────────────

export async function logScan(entry: Omit<SessionLogEntry, "id">): Promise<void> {
  await getDb().sessionLog.add(entry);
}

export async function getSessionLog(): Promise<SessionLogEntry[]> {
  return getDb().sessionLog.orderBy("scanned_at").reverse().toArray();
}

/**
 * Nine nights on one phone is nine nights of rows. Trim anything that is not
 * tonight's once the log is opened, so night 9 doesn't scroll through night 1.
 */
export async function pruneSessionLog(nightId: string): Promise<void> {
  const db = getDb();
  await db.sessionLog.filter((e) => e.night_id != null && e.night_id !== nightId).delete();
}
