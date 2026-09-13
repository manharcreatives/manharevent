/**
 * Gate-scanner access codes.
 *
 * The rule (docs/02-product/user-flows.md, Surface 3): a security guard at the
 * gate never self-registers for the scanner. The organizer adds them to the
 * team with their mobile number, issues them a code from the dashboard, and
 * that phone-plus-code pair is the only way into `apps/scanner`.
 *
 * ## Why the code is *derived* rather than stored
 *
 * The dashboard (:3001) and the scanner (:3002) are separate origins, so they
 * share no storage — a code the dashboard random-generated and saved in its own
 * localStorage would be invisible to the scanner, and the demo would be stuck
 * with a hardcoded roster. Deriving the code from `(phone, event, serial)` with
 * a shared secret means the scanner can verify a code the dashboard issued one
 * minute ago without either side talking to a server.
 *
 * ## What this is NOT
 *
 * `SIGNING_SECRET` ships in the client bundle, and `hash()` is a checksum, not
 * a MAC — anyone who reads the bundle can mint a code. That is fine for a demo
 * and wrong for production. The real implementation keeps this exact interface
 * and moves both functions behind the server: `issueGateCode` becomes an insert
 * into `scanner_login_codes` (see docs/03-architecture/data-model.md §5) and
 * `verifyGateCode` becomes a lookup that can also honour revocation, which a
 * stateless code fundamentally cannot. See HANDOFF-TO-BACKEND.md §6a.
 */

/** Excludes 0/O and 1/I/L — these get read aloud across a noisy gate. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const SIGNING_SECRET = "manhar-gate-demo-v1";

/**
 * India-first phone normalisation: `98765 43210`, `098765 43210`,
 * `+91 98765-43210` and `919876543210` all collapse to `+919876543210`, so a
 * guard typing their number the way they say it still matches the roster.
 */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return `+${digits}`;
}

export function isValidIndianPhone(input: string): boolean {
  return /^\+91[6-9]\d{9}$/.test(normalizePhone(input));
}

/** FNV-1a. Deterministic, dependency-free, and identical in Node and the browser. */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function encode(value: number, length: number): string {
  let out = "";
  let n = value;
  for (let i = 0; i < length; i++) {
    out += ALPHABET[n % ALPHABET.length];
    n = Math.floor(n / ALPHABET.length) + 7;
  }
  return out;
}

export interface GateCodeInput {
  phone: string;
  eventId: string;
  /** Bumped on every re-issue, so "regenerate" produces a different code. */
  serial?: number;
}

/**
 * Six characters, shown as `ABC-123`. Short enough to read over a phone call
 * and type on a number-less keypad, long enough that guessing it at a gate
 * isn't worth anyone's evening.
 */
export function issueGateCode({ phone, eventId, serial = 1 }: GateCodeInput): string {
  const material = `${SIGNING_SECRET}|${normalizePhone(phone)}|${eventId}|${serial}`;
  const raw = encode(hash(material), 6);
  return `${raw.slice(0, 3)}-${raw.slice(3)}`;
}

/** Normalises user input: lowercase, spaces, and a missing dash all still match. */
export function normalizeGateCode(input: string): string {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return raw.length === 6 ? `${raw.slice(0, 3)}-${raw.slice(3)}` : raw;
}

/**
 * True when `code` is a code this event could have issued to this phone, for
 * any serial up to `maxSerial`. Checking a window of serials rather than one
 * exact value is what lets a re-issued code work on a scanner that never heard
 * about the re-issue.
 */
export function verifyGateCode(
  phone: string,
  code: string,
  eventId: string,
  maxSerial = 20
): boolean {
  if (!isValidIndianPhone(phone)) return false;
  const candidate = normalizeGateCode(code);
  if (!/^[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(candidate)) return false;
  for (let serial = 1; serial <= maxSerial; serial++) {
    if (issueGateCode({ phone, eventId, serial }) === candidate) return true;
  }
  return false;
}
