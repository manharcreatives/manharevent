"use server";

import { revalidatePath } from "next/cache";
import { approveApplication, rejectApplication } from "@manhar-garba/mock-data";

// Client components can't call mock-data mutations directly — the
// in-memory store only exists in this server process. These wrap
// FE-08's approveApplication/rejectApplication for the internal-ops
// tenant-approval screen (FE-10, 2026-09-12 pivot).
export async function approveApplicationAction(id: string): Promise<{ ok: boolean }> {
  const result = await approveApplication(id);
  revalidatePath(`/admin/tenants/${id}`);
  revalidatePath("/admin/tenants");
  return { ok: result !== null };
}

export async function rejectApplicationAction(
  id: string,
  reason: string,
  moreInfoNeeded: boolean
): Promise<{ ok: boolean }> {
  const result = await rejectApplication(id, reason, moreInfoNeeded);
  revalidatePath(`/admin/tenants/${id}`);
  revalidatePath("/admin/tenants");
  return { ok: result !== null };
}
