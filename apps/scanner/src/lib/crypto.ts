/**
 * QR payload parsing and (eventually) signature verification.
 *
 * ## What this does today, stated plainly
 *
 * It does NOT verify anything cryptographically. `verifyQrPayload` checks the
 * payload *shape* (`MG26.v1.<passId>.<sig>`) and nothing more; the fixtures all
 * carry the literal signature `HMAC_STUB`. The only thing standing between a
 * forged QR and the gate is the manifest lookup in `validate.ts`, which requires
 * an exact `qr_payload` match — so a made-up payload fails, but a *photographed*
 * one does not. See `docs/HANDOFF-TO-BACKEND.md` §6.
 *
 * ## Why no secret lives in this file
 *
 * A gate phone is an untrusted client. Anything needed to *mint* a pass must
 * never ship in this bundle, or a guard with devtools becomes a ticket printer.
 * The P-12 design keeps the minting key server-side and gives the device only a
 * per-event *public* verification key, which is safe to ship: the device can
 * check a signature it could not have produced. When that lands, only the body
 * of `verifyQrPayload` changes — callers already treat `valid: false` as a hard
 * reject.
 */

export const QR_PREFIX = "MG26";
export const QR_VERSION = "v1";

export interface VerifyResult {
  valid: boolean;
  passId: string | null;
  /** True once a real signature was checked, not just the payload shape. */
  signatureChecked: boolean;
}

/** Verifies the QR payload signature. Stub: shape check only — see file header. */
export function verifyQrPayload(payload: string): VerifyResult {
  const parts = payload.trim().split(".");
  const shapeOk =
    parts.length >= 4 &&
    parts[0] === QR_PREFIX &&
    parts[1] === QR_VERSION &&
    Boolean(parts[2]) &&
    Boolean(parts[3]);

  return shapeOk
    ? { valid: true, passId: parts[2] ?? null, signatureChecked: false }
    : { valid: false, passId: null, signatureChecked: false };
}

export type ScanInputKind = "qr" | "pass_code" | "unknown";

/**
 * Tells a scanned QR payload from a typed pass code.
 *
 * These are two different strings for the same pass — `MG26.v1.pass-rina-001.…`
 * comes off the camera, `MG26-7F3K-9021` is what is printed under it for the
 * guard to type when the camera gives up. Treating the typed one as a QR payload
 * is what made every manual entry read "signature failed".
 */
export function classifyScanInput(input: string): ScanInputKind {
  const raw = input.trim();
  if (!raw) return "unknown";
  if (verifyQrPayload(raw).valid) return "qr";
  // Pass codes are dash-separated upper-case groups: MG26-7F3K-9021.
  if (/^[A-Z0-9]{2,6}(-[A-Z0-9]{2,6}){1,3}$/.test(raw.toUpperCase())) return "pass_code";
  return "unknown";
}

/** Normalises a typed code the way a tired guard types it: spaces, case, stray dashes. */
export function normalizePassCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "").replace(/-+/g, "-");
}
