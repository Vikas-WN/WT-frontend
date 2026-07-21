import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function JobCardSkeleton() {
  return (
    <div className="w-full rounded-xl border border-wt-border bg-wt-surface-1 p-4" aria-hidden>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-14 rounded-md" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        <Skeleton className="h-8 w-24 shrink-0 rounded-lg" />
      </div>
    </div>
  );
}

export function JobListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            <Skeleton className="h-5 w-36" />
          </CardTitle>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </CardHeader>
      <div className="border-t border-wt-border px-5 py-4 sm:px-6">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      <div className="space-y-3 px-5 pb-6 sm:px-6">
        {Array.from({ length: count }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    </Card>
  );
}
