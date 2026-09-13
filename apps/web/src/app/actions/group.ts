"use server";

import { joinGroupInvite } from "@manhar-garba/mock-data";
import { isValidIndianPhone, normalizePhone } from "@manhar-garba/domain";

export async function joinGroupAction(
  code: string,
  fullName: string,
  phoneInput: string
): Promise<{ ok: true } | { ok: false; reason: "invalid_phone" | "invalid_name" | "not_found" | "expired" | "full" | "already_joined" }> {
  if (fullName.trim().length < 2) return { ok: false, reason: "invalid_name" };
  if (!isValidIndianPhone(phoneInput)) return { ok: false, reason: "invalid_phone" };
  const result = await joinGroupInvite(code, fullName.trim(), normalizePhone(phoneInput));
  return result.ok ? { ok: true } : result;
}
