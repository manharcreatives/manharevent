/**
 * Cryptographic stub — function signatures are final; bodies land in P-12.
 *
 * In FE-05, QR payloads with the MG26.v1 prefix are treated as valid.
 * In P-12, this will verify an HMAC-SHA256 signature against a key derived
 * from the session + event key material.
 */

export interface VerifyResult {
  valid: boolean;
  passId: string | null;
}

/** Verifies the QR payload signature. Stub: accepts any MG26.v1.* payload. */
export function verifyQrPayload(payload: string): VerifyResult {
  const parts = payload.split(".");
  if (parts[0] === "MG26" && parts[1] === "v1" && parts.length >= 4) {
    return { valid: true, passId: parts[2] ?? null };
  }
  return { valid: false, passId: null };
}
