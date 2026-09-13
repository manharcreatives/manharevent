import { Skeleton } from "@manhar-garba/ui";

export default function CheckoutLoading() {
  return (
    <div className="mx-auto max-w-[480px] px-4 py-8 sm:px-6">
      <Skeleton className="h-9 w-48" />
      <div className="mt-6 space-y-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
