import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getApplication } from "@manhar-garba/mock-data";
import { Badge } from "@manhar-garba/ui";
import { ArrowLeft } from "lucide-react";
import { TenantApprovalActions } from "@/components/admin/tenant-approval-actions";

export const metadata: Metadata = { title: "Tenant application — Internal Ops" };

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  more_info_needed: "More info needed",
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function TenantApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = await getApplication(id);
  if (!application) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link href="/admin/tenants" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All applications
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{application.orgName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Application {application.id}</p>
        </div>
        <Badge variant={application.status === "approved" ? "success" : application.status === "rejected" ? "destructive" : application.status === "more_info_needed" ? "warning" : "primary"}>
          {STATUS_LABEL[application.status]}
        </Badge>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Contact person</dt>
          <dd className="mt-0.5 font-medium text-foreground">{application.contactName}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Mobile number</dt>
          <dd className="mt-0.5 font-medium text-foreground">{application.phone}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">City</dt>
          <dd className="mt-0.5 font-medium text-foreground">{application.city}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Rough capacity per night</dt>
          <dd className="mt-0.5 font-medium text-foreground">{application.roughCapacity.toLocaleString("en-IN")}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Desired subdomain</dt>
          <dd className="mt-0.5 font-medium text-foreground">{application.desiredDomain}.manharevent.com</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Submitted</dt>
          <dd className="mt-0.5 font-medium text-foreground">{fmt(application.submittedAt)}</dd>
        </div>
        {application.decidedAt && (
          <div>
            <dt className="text-xs text-muted-foreground">Decided</dt>
            <dd className="mt-0.5 font-medium text-foreground">{fmt(application.decidedAt)}</dd>
          </div>
        )}
        {application.provisionedAt && (
          <div>
            <dt className="text-xs text-muted-foreground">Provisioned</dt>
            <dd className="mt-0.5 font-medium text-foreground">{fmt(application.provisionedAt)}</dd>
          </div>
        )}
      </dl>

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Decision</h2>
        <TenantApprovalActions application={application} />
      </div>
    </div>
  );
}
