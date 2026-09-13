/**
 * Shareable group links for multi-admit passes. Two seeded cases so the
 * `/g/[code]` page can be demoed in both states: a live Couple pass with an
 * empty second spot, and an old link that has expired.
 */
export interface GroupInvite {
  code: string;
  passCode: string;
  createdByName: string;
  expiresAt: string;
}

export const groupInvites: GroupInvite[] = [
  {
    code: "RAJESH-4E5F",
    passCode: "MG26-4E5F-1234",
    createdByName: "Rajesh Mehta",
    expiresAt: "2026-10-01T23:59:00+05:30",
  },
  {
    code: "MEENA-2025",
    passCode: "MG26-9K1L-3344",
    createdByName: "Meena Joshi",
    expiresAt: "2025-10-01T23:59:00+05:30",
  },
];
