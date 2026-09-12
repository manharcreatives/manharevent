import type { Pass } from "../entities/pass";

/** Mirrors validate_pass() DB function — used identically online and offline. */
export type ScanVerdict =
  | "allowed"
  | "allowed_partial"
  | "already_in"
  | "wrong_zone"
  | "wrong_night"
  | "refunded"
  | "blocked"
  | "invalid";

export interface ScanInput {
  pass: Pass | null;
  night_id: string;
  gate_zone_id: string;
  current_checkin_count: number;
}

export interface ScanOutput {
  verdict: ScanVerdict;
  primary_text: string;
  secondary_text: string;
  /** true = auto-dismiss after 1.5s; false = requires tap */
  auto_dismiss: boolean;
  admitted_count?: number;
}

export function evaluatePass(input: ScanInput): ScanOutput {
  const { pass, night_id, gate_zone_id, current_checkin_count } = input;

  if (!pass) {
    return { verdict: "invalid", primary_text: "INVALID PASS", secondary_text: "Signature failed", auto_dismiss: false };
  }

  if (pass.status === "refunded" || pass.status === "cancelled") {
    return { verdict: "refunded", primary_text: "REFUNDED", secondary_text: "Pass has been refunded", auto_dismiss: false };
  }

  if (pass.status === "blocked") {
    return { verdict: "blocked", primary_text: "CALL SUPERVISOR", secondary_text: pass.blocked_reason ?? "Blocked", auto_dismiss: false };
  }

  if (pass.zone_id !== gate_zone_id) {
    return { verdict: "wrong_zone", primary_text: "WRONG GATE", secondary_text: `Pass is for a different zone`, auto_dismiss: false };
  }

  if (!pass.night_ids.includes(night_id)) {
    return { verdict: "wrong_night", primary_text: "NOT VALID TONIGHT", secondary_text: `Not valid for this night`, auto_dismiss: false };
  }

  if (current_checkin_count >= pass.admits) {
    return { verdict: "already_in", primary_text: "ALREADY INSIDE", secondary_text: `All ${pass.admits} admits used`, auto_dismiss: false };
  }

  const new_count = current_checkin_count + 1;
  if (new_count < pass.admits) {
    return {
      verdict: "allowed_partial",
      primary_text: "ALLOWED",
      secondary_text: `${new_count} of ${pass.admits} entered`,
      auto_dismiss: true,
      admitted_count: new_count,
    };
  }

  return {
    verdict: "allowed",
    primary_text: "ALLOWED",
    secondary_text: `${pass.admits} of ${pass.admits} · All in`,
    auto_dismiss: true,
    admitted_count: new_count,
  };
}
