import { classifyScanInput, normalizePassCode, verifyQrPayload } from "./crypto";
import type { ScanManifestEntry } from "@manhar-garba/mock-data";
import type { EntryMethod } from "./db";

// 8 verdict states as specified in design-system.md §6 — this union is also the
// `state` prop of <ScanResult>, so it cannot grow without the design system.
export type ScanVerdict =
  | "allowed"
  | "allowed_partial"
  | "already_in"
  | "wrong_zone"
  | "wrong_night"
  | "refunded"
  | "blocked"
  | "invalid";

/**
 * Why a scan came out the way it did. The verdict drives the colour; this drives
 * the words, the log, and the `denied_reason` ops sees in the morning. Four very
 * different failures used to collapse into one red "INVALID PASS".
 */
export type ScanReason =
  | "ok"
  | "ok_partial"
  | "bad_signature"
  | "not_in_manifest"
  | "manifest_empty"
  | "unreadable"
  | "refunded"
  | "cancelled"
  | "blocked"
  | "transferred"
  | "used_up"
  | "wrong_night"
  | "wrong_zone"
  | "already_in";

export interface ValidationResult {
  verdict: ScanVerdict;
  reason: ScanReason;
  primaryText: string;
  secondaryText: string;
  /** The one line that tells the guard what to do next. */
  actionText: string;
  holderName: string | null;
  holderPhotoUrl: string | null;
  passCode: string | null;
  passId: string | null;
  admitsEntered?: number;
  admitsTotal?: number;
}

export interface ValidateOptions {
  activeNightId: string;
  gateZoneId: string;
  gateZoneName: string;
  manifest: ScanManifestEntry[];
  /** `manual` skips the QR signature step — there is no signature to check. */
  source?: EntryMethod;
}

function nightLabel(nightId: string): string {
  const n = parseInt(nightId.replace(/\D/g, ""), 10);
  return isNaN(n) ? nightId : `Night ${n}`;
}

/**
 * "Nights 2-7" is a lie when the pass is only valid on 2 and 7. Contiguous runs
 * collapse, gaps stay visible — a guard reads this out to the person in front of
 * them, so it has to be true.
 */
function formatNightRange(nightIds: string[]): string {
  if (nightIds.length === 0) return "—";
  if (nightIds.length === 9) return "All 9 nights";

  const nums = [...new Set(nightIds.map((id) => parseInt(id.replace(/\D/g, ""), 10)))]
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);
  if (nums.length === 0) return "—";

  const runs: string[] = [];
  let start = nums[0]!;
  let prev = nums[0]!;
  for (const n of nums.slice(1)) {
    if (n === prev + 1) {
      prev = n;
      continue;
    }
    runs.push(start === prev ? `${start}` : `${start}–${prev}`);
    start = n;
    prev = n;
  }
  runs.push(start === prev ? `${start}` : `${start}–${prev}`);

  return `${nums.length === 1 ? "Night" : "Nights"} ${runs.join(", ")}`;
}

function deny(
  verdict: ScanVerdict,
  reason: ScanReason,
  primaryText: string,
  secondaryText: string,
  actionText: string,
  entry?: ScanManifestEntry
): ValidationResult {
  return {
    verdict,
    reason,
    primaryText,
    secondaryText,
    actionText,
    holderName: entry?.holder_name ?? null,
    holderPhotoUrl: entry?.holder_photo_url ?? null,
    passCode: entry?.pass_code ?? null,
    passId: entry?.pass_id ?? null,
  };
}

/**
 * The whole gate decision, offline, from data already on the device.
 *
 * Accepts either form of the same pass: the QR payload off the camera, or the
 * printed pass code a guard types when the camera can't cope. Manual entry used
 * to be routed through the QR signature check, which no pass code can ever pass
 * — so the camera fallback could not admit a single person.
 */
export function validateScan(input: string, options: ValidateOptions): ValidationResult {
  const { activeNightId, gateZoneId, gateZoneName, manifest, source = "qr" } = options;
  const raw = input.trim();

  // Step 0 — an empty manifest is an operational failure, not a bad pass. Saying
  // "invalid pass" here sends a paying customer away because the phone never
  // synced, which is the wrong person to blame.
  if (manifest.length === 0) {
    return deny(
      "invalid",
      "manifest_empty",
      "NO PASS LIST",
      "This phone has not downloaded tonight's passes",
      "Tap sync at the top, or use another phone"
    );
  }

  const kind = classifyScanInput(raw);

  if (kind === "unknown") {
    return deny(
      "invalid",
      source === "manual" ? "unreadable" : "bad_signature",
      "NOT A PASS",
      source === "manual"
        ? "That is not a ManharEvent pass code"
        : "This QR code is not a ManharEvent pass",
      "Check the code printed under the QR and type it in"
    );
  }

  // Step 1 — signature. Only a QR payload carries one; see crypto.ts on what
  // "verified" does and does not mean today.
  let entry: ScanManifestEntry | undefined;

  if (kind === "qr") {
    if (!verifyQrPayload(raw).valid) {
      return deny(
        "invalid",
        "bad_signature",
        "INVALID PASS",
        "Signature check failed",
        "Do not admit — ask for the order SMS"
      );
    }
    entry = manifest.find((e) => e.qr_payload === raw);
  } else {
    const code = normalizePassCode(raw);
    entry = manifest.find((e) => normalizePassCode(e.pass_code) === code);
  }

  // Step 2 — manifest lookup
  if (!entry) {
    return deny(
      "invalid",
      "not_in_manifest",
      "PASS NOT FOUND",
      source === "manual"
        ? "No pass with that code in tonight's list"
        : "This pass is not in tonight's list",
      "Check the code, or send them to the help desk"
    );
  }

  const suffix = source === "manual" ? " · typed in" : "";

  // Step 3 — Status checks
  if (entry.status === "refunded" || entry.status === "cancelled") {
    return deny(
      "refunded",
      entry.status === "refunded" ? "refunded" : "cancelled",
      entry.status === "refunded" ? "REFUNDED" : "CANCELLED",
      entry.status === "refunded"
        ? "This pass was refunded — the money is back with them"
        : "This order was cancelled",
      "Do not admit — send them to the help desk",
      entry
    );
  }
  if (entry.status === "blocked") {
    return deny(
      "blocked",
      "blocked",
      "CALL SUPERVISOR",
      entry.blocked_reason ?? "Pass blocked by the organizer",
      "Hold the pass and call your supervisor now",
      entry
    );
  }
  if (entry.status === "transferred") {
    return deny(
      "invalid",
      "transferred",
      "PASS TRANSFERRED",
      "This pass was passed on to someone else — their QR is the live one",
      "Ask for the new QR sent on WhatsApp",
      entry
    );
  }
  if (entry.status === "used_up") {
    return deny(
      "already_in",
      "used_up",
      "ALL ADMITS USED",
      `All ${entry.admits} admit${entry.admits === 1 ? "" : "s"} on this pass are spent`,
      "Do not admit — they need another pass",
      entry
    );
  }

  // Step 4 — Night check
  if (!entry.night_ids.includes(activeNightId)) {
    return deny(
      "wrong_night",
      "wrong_night",
      "NOT VALID TONIGHT",
      `Valid ${formatNightRange(entry.night_ids)} — tonight is ${nightLabel(activeNightId)}`,
      "Do not admit — they can upgrade at the help desk",
      entry
    );
  }

  // Step 5 — Zone check
  if (entry.zone_id !== gateZoneId) {
    return deny(
      "wrong_zone",
      "wrong_zone",
      "WRONG GATE",
      `${entry.zone_name} pass — this gate is ${gateZoneName}`,
      `Point them to the ${entry.zone_name} gate`,
      entry
    );
  }

  // Step 6 — Admit count
  const tonightCount = entry.tonight_checkin_count ?? 0;
  if (tonightCount >= entry.admits) {
    return deny(
      "already_in",
      "already_in",
      "ALREADY INSIDE",
      entry.admits === 1
        ? `This pass was already scanned in tonight${suffix}`
        : `All ${entry.admits} admits on this pass are already in${suffix}`,
      "Do not admit — check the pass belongs to them",
      entry
    );
  }

  // Step 7 — Allow
  const entering = tonightCount + 1;
  const partial = entry.admits > 1 && entering < entry.admits;
  const countLine = entry.admits > 1 ? ` · ${entering} of ${entry.admits}` : "";

  return {
    verdict: partial ? "allowed_partial" : "allowed",
    reason: partial ? "ok_partial" : "ok",
    primaryText: entry.holder_name ?? "ADMITTED",
    secondaryText: `${entry.zone_name}${countLine} · ${nightLabel(activeNightId)}${suffix}`,
    actionText: partial
      ? `Let them in — ${entry.admits - entering} more on this pass`
      : "Let them in",
    holderName: entry.holder_name,
    holderPhotoUrl: entry.holder_photo_url,
    passCode: entry.pass_code,
    passId: entry.pass_id,
    admitsEntered: entering,
    admitsTotal: entry.admits,
  };
}
