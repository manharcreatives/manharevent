import { Skeleton } from "@manhar-garba/ui";

export default function EventLoading() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
      <div className="mt-10 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
