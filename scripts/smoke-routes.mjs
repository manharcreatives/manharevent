/**
 * Fetches every route in all four apps and checks it returns what it should:
 * 200 for a real page, 404 for a path that shouldn't exist.
 *
 * Needs `pnpm dev` running. Run it after any routing change — it catches the
 * link that quietly started 404ing, which is the failure this project cares
 * about most.
 *
 *   pnpm dev            # in one terminal
 *   pnpm smoke          # in another
 */
const ROUTES = {
  "web :3000": ["/", "/en", "/gu", "/hi",
    "/en/e/manhar-navratri-2026", "/en/e/manhar-navratri-2026/book",
    "/en/e/manhar-navratri-2026/lineup", "/en/e/manhar-navratri-2026/venue",
    "/en/e/manhar-navratri-2026/faq", "/en/e/manhar-navratri-2026/gallery",
    "/en/e/manhar-navratri-2026/night/1",
    "/en/auth/start", "/en/auth/verify", "/en/auth/profile",
    "/en/me", "/en/me/passes", "/en/me/orders", "/en/me/wallet", "/en/me/refunds",
    "/en/legal/terms", "/en/legal/privacy", "/en/legal/refund-policy",
    "/en/artist/kirtidan-gadhvi", "/en/me/passes/pass-rina-001",
    "/robots.txt", "/sitemap.xml",
    "/en/this-page-does-not-exist"],
  "dashboard :3001": ["/", "/dashboard", "/dashboard/events", "/dashboard/events/new",
    "/dashboard/events/ev-navratri-2026-ahmedabad",
    "/dashboard/events/ev-navratri-2026-ahmedabad/nights",
    "/dashboard/events/ev-navratri-2026-ahmedabad/passes",
    "/dashboard/events/ev-navratri-2026-ahmedabad/addons",
    "/dashboard/events/ev-navratri-2026-ahmedabad/venue",
    "/dashboard/events/ev-navratri-2026-ahmedabad/policy",
    "/dashboard/events/ev-navratri-2026-ahmedabad/promos",
    "/dashboard/events/ev-navratri-2026-ahmedabad/comps",
    "/dashboard/events/ev-navratri-2026-ahmedabad/publish",
    "/dashboard/events/ev-navratri-2026-ahmedabad/attendees",
    "/dashboard/events/ev-navratri-2026-ahmedabad/checkins",
    "/dashboard/events/ev-navratri-2026-ahmedabad/live",
    "/dashboard/events/ev-navratri-2026-ahmedabad/reports",
    "/dashboard/finance", "/dashboard/finance/orders", "/dashboard/finance/refunds",
    "/dashboard/finance/payouts", "/dashboard/finance/gst",
    "/dashboard/team", "/dashboard/team/gate-staff",
    "/dashboard/vendors", "/dashboard/sponsors",
    "/dashboard/settings/branding", "/dashboard/settings/domain",
    "/dashboard/settings/payments", "/dashboard/settings/notifications",
    "/dashboard/settings/audit",
    "/admin", "/admin/emergency", "/admin/tenants", "/admin/tenants/ta-mock-001",
    "/gallery", "/nope-404"],
  "scanner :3002": ["/", "/login", "/scan", "/scan/log", "/scan/manual", "/scan/onboarding", "/nope-404"],
  "marketing :3003": ["/", "/en", "/gu", "/hi", "/en/pricing", "/en/register",
    "/en/register/verify", "/en/register/status", "/en/register/provisioned", "/en/nope-404"],
};
const PORTS = { "web :3000": 3000, "dashboard :3001": 3001, "scanner :3002": 3002, "marketing :3003": 3003 };

let bad = 0, checked = 0;
for (const [app, paths] of Object.entries(ROUTES)) {
  console.log(`\n=== ${app} ===`);
  for (const p of paths) {
    const url = `http://localhost:${PORTS[app]}${p}`;
    const expect404 = p.includes("404") || p.includes("does-not-exist");
    try {
      const r = await fetch(url, { redirect: "follow" });
      checked++;
      const ok = expect404 ? r.status === 404 : r.status === 200;
      if (!ok) { bad++; console.log(`  ${r.status}  ${p}   <-- ${expect404 ? "expected 404" : "expected 200"}`); }
      else console.log(`  ${r.status}  ${p}`);
    } catch (e) {
      bad++; checked++;
      console.log(`  ERR  ${p}  ${e.message}`);
    }
  }
}
console.log(`\n${checked} routes checked, ${bad} problem(s).`);
