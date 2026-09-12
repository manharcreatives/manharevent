import { verifyQrPayload } from "./crypto";
import type { ScanManifestEntry } from "@manhar-garba/mock-data";

// 8 verdict states as specified in design-system.md §6
export type ScanVerdict =
  | "allowed"
  | "allowed_partial"
  | "already_in"
  | "wrong_zone"
  | "wrong_night"
  | "refunded"
  | "blocked"
  | "invalid";

export interface ValidationResult {
  verdict: ScanVerdict;
  primaryText: string;
  secondaryText: string;
  holderName: string | null;
  holderPhotoUrl: string | null;
  passCode: string | null;
  admitsEntered?: number;
  admitsTotal?: number;
}

function nightLabel(nightId: string): string {
  const n = parseInt(nightId.replace("night-0", "").replace("night-", ""), 10);
  return isNaN(n) ? nightId : `Night ${n}`;
}

function formatNightRange(nightIds: string[]): string {
  if (nightIds.length === 0) return "—";
  if (nightIds.length === 9) return "All 9 nights";
  const nums = nightIds.map((id) => parseInt(id.replace(/\D/g, ""), 10)).sort((a, b) => a - b);
  if (nums.length === 1) return `Night ${nums[0]}`;
  return `Nights ${nums[0]}–${nums[nums.length - 1]}`;
}

export function validateScan(
  qrPayload: string,
  activeNightId: string,
  gateZoneId: string,
  gateZoneName: string,
  manifest: ScanManifestEntry[]
): ValidationResult {
  // Step 1 — Signature check (stubbed in FE-05; real HMAC in P-12)
  const { valid } = verifyQrPayload(qrPayload);
  if (!valid) {
    return {
      verdict: "invalid",
      primaryText: "INVALID PASS",
      secondaryText: "Signature failed",
      holderName: null,
      holderPhotoUrl: null,
      passCode: null,
    };
  }

  // Step 2 — Manifest lookup
  const entry = manifest.find((e) => e.qr_payload === qrPayload);
  if (!entry) {
    return {
      verdict: "invalid",
      primaryText: "INVALID PASS",
      secondaryText: "Pass not found in manifest",
      holderName: null,
      holderPhotoUrl: null,
      passCode: null,
    };
  }

  const holder = entry.holder_name;
  const photo = entry.holder_photo_url;

  // Step 3 — Status checks
  if (entry.status === "refunded" || entry.status === "cancelled") {
    return {
      verdict: "refunded",
      primaryText: "REFUNDED",
      secondaryText: "This pass has been refunded",
      holderName: holder,
      holderPhotoUrl: photo,
      passCode: entry.pass_code,
    };
  }
  if (entry.status === "blocked") {
    return {
      verdict: "blocked",
      primaryText: "CALL SUPERVISOR",
      secondaryText: entry.blocked_reason ?? "Pass blocked — supervisor required",
      holderName: holder,
      holderPhotoUrl: photo,
      passCode: entry.pass_code,
    };
  }
  if (entry.status === "transferred" || entry.status === "used_up") {
    return {
      verdict: "invalid",
      primaryText: "INVALID PASS",
      secondaryText: entry.status === "transferred" ? "Pass has been transferred" : "All admits used",
      holderName: holder,
      holderPhotoUrl: photo,
      passCode: entry.pass_code,
    };
  }

  // Step 4 — Night check
  if (!entry.night_ids.includes(activeNightId)) {
    return {
      verdict: "wrong_night",
      primaryText: "NOT VALID TONIGHT",
      secondaryText: `Valid: ${formatNightRange(entry.night_ids)}`,
      holderName: holder,
      holderPhotoUrl: photo,
      passCode: entry.pass_code,
    };
  }

  // Step 5 — Zone check
  if (entry.zone_id !== gateZoneId) {
    return {
      verdict: "wrong_zone",
      primaryText: "WRONG GATE",
      secondaryText: `${entry.zone_name} pass · this is ${gateZoneName}`,
      holderName: holder,
      holderPhotoUrl: photo,
      passCode: entry.pass_code,
    };
  }

  // Step 6 — Admit count
  const tonightCount = entry.tonight_checkin_count;
  if (tonightCount >= entry.admits) {
    const lastTime = nightLabel(activeNightId);
    return {
      verdict: "already_in",
      primaryText: "ALREADY INSIDE",
      secondaryText: `${entry.admits === 1 ? "Entered earlier" : `All ${entry.admits} admits used`} · ${lastTime}`,
      holderName: holder,
      holderPhotoUrl: photo,
      passCode: entry.pass_code,
    };
  }

  // Step 7 — Allow
  const entering = tonightCount + 1;
  if (entry.admits > 1 && entering < entry.admits) {
    // Intermediate admit on a group pass
    return {
      verdict: "allowed_partial",
      primaryText: holder ?? "ADMITTED",
      secondaryText: `${entry.zone_name} · ${entering} of ${entry.admits} · ${nightLabel(activeNightId)}`,
      holderName: holder,
      holderPhotoUrl: photo,
      passCode: entry.pass_code,
      admitsEntered: entering,
      admitsTotal: entry.admits,
    };
  }

  // Final admit or single-admit pass
  return {
    verdict: "allowed",
    primaryText: holder ?? "ADMITTED",
    secondaryText: entry.admits > 1
      ? `${entry.zone_name} · ${entering} of ${entry.admits} · ${nightLabel(activeNightId)}`
      : `${entry.zone_name} · ${nightLabel(activeNightId)}`,
    holderName: holder,
    holderPhotoUrl: photo,
    passCode: entry.pass_code,
  };
}
