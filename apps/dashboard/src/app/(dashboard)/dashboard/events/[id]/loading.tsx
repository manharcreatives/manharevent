import { Skeleton } from "@manhar-garba/ui";

export default function EventLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <Skeleton className="h-9 w-64" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}
