import { enqueueCheckIn, getPendingQueue, markSynced, markFailed, type EntryMethod } from "./db";
import { getDeviceId } from "./device-id";
import { recordCheckIn, TENANT_ID, EVENT_ID } from "@manhar-garba/mock-data";

export interface QueueContext {
  gate_id: string;
  zone_id: string;
  night_id: string;
  staff_id: string;
  entry_method: EntryMethod;
}

export async function queueCheckIn(
  passId: string,
  passCode: string,
  direction: "in" | "out",
  result: "allowed" | "denied",
  deniedReason: string | null,
  ctx: QueueContext
): Promise<void> {
  await enqueueCheckIn({
    // Generated per physical scan, and the server upsert key. It makes a *retry*
    // idempotent; it does NOT make a second scan of the same pass idempotent —
    // that is the manifest's admit count's job, and across two offline phones it
    // is nobody's job until the rows meet on the server. See report §replay.
    client_uuid: crypto.randomUUID(),
    pass_id: passId,
    pass_code: passCode,
    direction,
    result,
    denied_reason: deniedReason,
    gate_id: ctx.gate_id,
    zone_id: ctx.zone_id,
    night_id: ctx.night_id,
    scanned_at: new Date().toISOString(),
    device_id: getDeviceId(),
    // Who scanned, not just which phone — a device can be handed over mid-shift,
    // so the staff id is what makes a disputed scan traceable to a person.
    staff_id: ctx.staff_id,
    entry_method: ctx.entry_method,
    synced: 0,
    attempts: 0,
    last_error: null,
  });
}

export interface FlushResult {
  synced: number;
  failed: number;
  remaining: number;
}

/**
 * Flushes the queue to the mock repo (FE-07 handoff: Supabase upsert).
 *
 * One row at a time, each marked the moment *its own* upsert returns. The old
 * version collected ids through the whole loop and marked them at the end, so a
 * single failure halfway meant none of the successful rows were marked and every
 * one of them was re-sent on the next attempt. A failing row is counted and
 * skipped rather than aborting the flush — one unparseable scan must not hold
 * the rest of the night's gate data hostage.
 */
export async function flushQueue(): Promise<FlushResult> {
  const pending = await getPendingQueue();
  if (pending.length === 0) return { synced: 0, failed: 0, remaining: 0 };

  let synced = 0;
  let failed = 0;

  for (const entry of pending) {
    if (entry.id == null) continue;
    try {
      await recordCheckIn({
        tenant_id: TENANT_ID,
        event_id: EVENT_ID,
        night_id: entry.night_id,
        pass_id: entry.pass_id,
        pass_holder_id: null,
        gate_id: entry.gate_id,
        zone_id: entry.zone_id,
        direction: entry.direction,
        result: entry.result === "allowed" ? "allowed" : "denied",
        denied_reason: entry.denied_reason,
        scanned_by: entry.staff_id ?? null,
        device_id: entry.device_id,
        scanned_at: entry.scanned_at,
        synced_at: new Date().toISOString(),
        client_uuid: entry.client_uuid,
      });
      await markSynced([entry.id]);
      synced++;
    } catch (err) {
      await markFailed(entry.id, err instanceof Error ? err.message : "upload failed");
      failed++;
    }
  }

  return { synced, failed, remaining: failed };
}
