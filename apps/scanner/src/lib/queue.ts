import { enqueueCheckIn, getPendingQueue, markSynced } from "./db";
import { getDeviceId } from "./device-id";
import { recordCheckIn } from "@manhar-garba/mock-data";

export async function queueCheckIn(
  passId: string,
  passCode: string,
  direction: "in" | "out",
  result: "allowed" | "denied",
  deniedReason: string | null,
  settings: { gate_id: string; zone_id: string; night_id: string }
): Promise<void> {
  const clientUuid = crypto.randomUUID();
  const scannedAt = new Date().toISOString();

  await enqueueCheckIn({
    client_uuid: clientUuid,
    pass_id: passId,
    pass_code: passCode,
    direction,
    result,
    denied_reason: deniedReason,
    gate_id: settings.gate_id,
    zone_id: settings.zone_id,
    night_id: settings.night_id,
    scanned_at: scannedAt,
    device_id: getDeviceId(),
    synced: false,
  });
}

/** Flush queue to the mock repo (FE-07 handoff: Supabase upsert). */
export async function flushQueue(): Promise<number> {
  const pending = await getPendingQueue();
  if (pending.length === 0) return 0;

  const ids: number[] = [];
  for (const entry of pending) {
    await recordCheckIn({
      tenant_id: "t-manhar-ahmedabad-001",
      event_id: "ev-navratri-2026-ahmedabad",
      night_id: entry.night_id,
      pass_id: entry.pass_id,
      pass_holder_id: null,
      gate_id: entry.gate_id,
      zone_id: entry.zone_id,
      direction: entry.direction,
      result: entry.result === "allowed" ? "allowed" : "denied",
      denied_reason: entry.denied_reason,
      scanned_by: null,
      device_id: entry.device_id,
      scanned_at: entry.scanned_at,
      synced_at: new Date().toISOString(),
      client_uuid: entry.client_uuid,
    });
    if (entry.id != null) ids.push(entry.id);
  }

  await markSynced(ids);
  return ids.length;
}
