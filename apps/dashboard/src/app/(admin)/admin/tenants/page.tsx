import type { Metadata } from "next";
import Link from "next/link";
import type { TenantApplicationStatus } from "@manhar-garba/domain";
import { listApplications } from "@manhar-garba/mock-data";
import { Badge, EmptyState } from "@manhar-garba/ui";

export const metadata: Metadata = { title: "Tenant applications — Internal Ops" };

const STATUS_LABEL: Record<TenantApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  more_info_needed: "More info needed",
};

const STATUS_VARIANT: Record<TenantApplicationStatus, "default" | "primary" | "success" | "warning" | "destructive"> = {
  draft: "default",
  submitted: "primary",
  under_review: "primary",
  approved: "success",
  rejected: "destructive",
  more_info_needed: "warning",
};

const FILTER_TABS: { label: string; status: TenantApplicationStatus | "all" }[] = [
  { label: "All", status: "all" },
  { label: "Under review", status: "under_review" },
  { label: "Approved", status: "approved" },
  { label: "More info needed", status: "more_info_needed" },
  { label: "Rejected", status: "rejected" },
];

export default async function TenantApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const activeStatus = (statusParam as TenantApplicationStatus | undefined) ?? undefined;

  const applications = await listApplications(activeStatus);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Organizer registrations</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Review, approve, or reject applications submitted at ManharEvent&apos;s &ldquo;Register your event&rdquo; flow.
      </p>

      <nav className="mt-4 flex flex-wrap gap-2 border-b border-border pb-3" aria-label="Filter by status">
        {FILTER_TABS.map((tab) => {
          const href = tab.status === "all" ? "/admin/tenants" : `/admin/tenants?status=${tab.status}`;
          const isActive = tab.status === "all" ? !activeStatus : activeStatus === tab.status;
          return (
            <Link
              key={tab.status}
              href={href}
              className={
                isActive
                  ? "rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                  : "rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {applications.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No applications in this status" />
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
          {applications.map((app) => (
            <li key={app.id}>
              <Link
                href={`/admin/tenants/${app.id}`}
                className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-surface-raised sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">{app.orgName}</p>
                  <p className="text-xs text-muted-foreground">
                    {app.contactName} · {app.city} · {app.phone}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <Badge variant={STATUS_VARIANT[app.status]}>{STATUS_LABEL[app.status]}</Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
