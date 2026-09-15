"use client";

import { EVENT_ID } from "@manhar-garba/mock-data";
import {
  claimAdmit,
  releaseAdmit,
  getManifestIndex,
  logScan,
  type EntryMethod,
  type ScannerSettings,
} from "./db";
import { getDeviceId } from "./device-id";
import { queueCheckIn } from "./queue";
import { broadcastCheckIn } from "./realtime";
import { validateScan, type ValidationResult } from "./validate";

export interface CommitContext {
  settings: ScannerSettings;
  staffId: string;
  direction: "in" | "out";
  source: EntryMethod;
}

/**
 * The one place a scan turns into a decision plus a durable record.
 *
 * Both the camera screen and the manual screen go through here, which is the
 * point: they used to each keep their own in-memory copy of the manifest and
 * their own admit-count bookkeeping, and the manual screen simply never wrote
 * its increment back to the copy it was reading. Typing the same one-admit code
 * twice on that screen admitted twice and queued two "allowed" rows.
 *
 * The manifest index (db.ts) is a single in-memory cache both screens share
 * and claimAdmit/releaseAdmit patch in place, so the count a decision is made
 * against reflects anything the other screen just wrote — without re-reading
 * IndexedDB or linear-scanning the manifest on every tap (ARCH-12/P3-4).
 */
export async function commitScan(
  input: string,
  ctx: CommitContext
): Promise<ValidationResult> {
  const { settings, staffId, direction, source } = ctx;
  const manifest = await getManifestIndex();

  const result = validateScan(input, {
    activeNightId: settings.night_id,
    gateZoneId: settings.zone_id,
    gateZoneName: settings.zone_name,
    manifest,
    source,
  });

  let final = result;
  const allowed = result.verdict === "allowed" || result.verdict === "allowed_partial";

  if (allowed && result.passCode && result.passId && direction === "in") {
    // Claim first, decide second. Between validate and here another scan could
    // have taken the last admit, and the claim is the only thing that is atomic.
    const claimed = await claimAdmit(result.passCode);
    if (claimed == null || claimed > (result.admitsTotal ?? 1)) {
      if (claimed != null) await releaseAdmit(result.passCode);
      final = {
        ...result,
        verdict: "already_in",
        reason: "already_in",
        primaryText: "ALREADY INSIDE",
        secondaryText: "That admit was taken a moment ago",
        actionText: "Do not admit — check the pass belongs to them",
      };
    }
  }

  const isAllow = final.verdict === "allowed" || final.verdict === "allowed_partial";

  if (final.passId && final.passCode) {
    await queueCheckIn(
      final.passId,
      final.passCode,
      direction,
      isAllow ? "allowed" : "denied",
      isAllow ? null : final.reason,
      {
        gate_id: settings.gate_id,
        zone_id: settings.zone_id,
        night_id: settings.night_id,
        staff_id: staffId,
        entry_method: source,
      }
    );
  }

  await logScan({
    scanned_at: new Date().toISOString(),
    pass_code: final.passCode ?? input.slice(0, 24),
    verdict: final.verdict,
    holder_name: final.holderName,
    direction,
    is_manual: source === "manual",
    night_id: settings.night_id,
  });

  if (isAllow && final.passCode) {
    // Fire-and-forget: nothing about the gate decision waits on this.
    void broadcastCheckIn(EVENT_ID, settings.night_id, final.passCode, direction, getDeviceId());
  }

  return final;
}
