"use server";

import { submitApplication, getApplication } from "@manhar-garba/mock-data";
import type { TenantApplication } from "@manhar-garba/domain";

interface SubmitApplicationInput {
  orgName: string;
  contactName: string;
  phone: string;
  city: string;
  roughCapacity: number;
  desiredDomain: string;
}

export async function submitApplicationAction(
  input: SubmitApplicationInput
): Promise<{ applicationId: string }> {
  const application = await submitApplication(input);
  return { applicationId: application.id };
}

export async function getApplicationAction(id: string): Promise<TenantApplication | null> {
  return getApplication(id);
}
