/**
 * Verifies the two loops the demo lives or dies on, without a browser:
 *
 *   1. Attendee: phone -> paid order -> issued pass -> the exact QR string
 *      the pass page renders is present in the gate scanner's manifest.
 *   2. Gate staff: a code the dashboard issues for a phone verifies in the
 *      scanner, another person's code does not, and regenerating replaces it.
 *
 * Run with `pnpm verify:demo`. If this fails, the demo is broken even if
 * every page still renders.
 *
 * Imports reach into the source files rather than the package barrel because
 * tsx does not follow mock-data's `export *` chain, and this script runs
 * from the workspace root, which does not depend on either package.
 */
import { buildScanManifest, listOrdersByPhone, listPassesForOrder } from "../packages/mock-data/src/repo.js";
import { passes as allPasses } from "../packages/mock-data/src/fixtures/passes.js";
import { gateStaff, gateStaffCode, findGateStaffByPhone } from "../packages/mock-data/src/fixtures/gate-staff.js";
import { EVENT_ID } from "../packages/mock-data/src/fixtures/event.js";
import { verifyGateCode, issueGateCode, normalizePhone } from "../packages/domain/src/index.js";

let fails = 0;
const check = (name: string, ok: boolean, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`);
  if (!ok) fails++;
};

// 1. Attendee path: phone -> orders -> passes -> qr_payload
const orders = await listOrdersByPhone("+919876543001");
check("buyer +919876543001 has orders", orders.length > 0, `${orders.length} order(s)`);
const paid = orders.find((o) => o.status === "paid");
check("buyer has a paid order", Boolean(paid));
const myPasses = paid ? await listPassesForOrder(paid.id) : [];
check("paid order issued passes", myPasses.length > 0, `${myPasses.length} pass(es)`);

// 2. Gate path: that pass's QR must be in the scanner's manifest
const manifest = await buildScanManifest(EVENT_ID, "night-05");
check("manifest built", manifest.length > 0, `${manifest.length} entries`);
for (const p of myPasses) {
  const inManifest = manifest.some((m) => m.qr_payload === p.qr_payload);
  check(`pass ${p.pass_code} QR is scannable at the gate`, inManifest, p.qr_payload);
}

// 3. Every seeded pass should be reachable, not just this buyer's
const missing = allPasses.filter((p) => !manifest.some((m) => m.qr_payload === p.qr_payload));
check("every seeded pass is in the manifest", missing.length === 0,
  missing.length ? `missing: ${missing.map((m) => m.pass_code).join(", ")}` : "");

// 4. Gate-staff sign-in: dashboard-issued code verifies in the scanner
for (const m of gateStaff) {
  const code = gateStaffCode(m);
  check(`${m.name} (${m.phone}) code ${code} verifies`, verifyGateCode(m.phone, code, EVENT_ID));
}
check("a wrong code is rejected", !verifyGateCode(gateStaff[0]!.phone, "AAA-999", EVENT_ID));
check("another staff member's code is rejected on this phone",
  !verifyGateCode(gateStaff[0]!.phone, gateStaffCode(gateStaff[1]!), EVENT_ID));
check("an unknown phone is not on the roster", findGateStaffByPhone("+919999999999") === undefined);
check("phone typed without +91 still matches", findGateStaffByPhone("9825011001")?.id === "gs-1");
check("regenerating changes the code",
  issueGateCode({ phone: normalizePhone("9825011001"), eventId: EVENT_ID, serial: 1 }) !==
  issueGateCode({ phone: normalizePhone("9825011001"), eventId: EVENT_ID, serial: 2 }));
check("a regenerated code still verifies",
  verifyGateCode("9825011001", issueGateCode({ phone: normalizePhone("9825011001"), eventId: EVENT_ID, serial: 2 }), EVENT_ID));

console.log(`\n${fails === 0 ? "All checks passed." : fails + " check(s) failed."}`);
process.exit(fails === 0 ? 0 : 1);
