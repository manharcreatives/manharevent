import { redirect } from "next/navigation";

// "/admin — Platform overview" per the route map is a future KPI dashboard
// (revenue across tenants, health, queues — user-flows.md's Internal ops
// section). Not built yet; redirecting to the one internal-ops screen that
// is (tenant approvals) rather than serving an empty page.
export default function AdminIndexPage() {
  redirect("/admin/tenants");
}
