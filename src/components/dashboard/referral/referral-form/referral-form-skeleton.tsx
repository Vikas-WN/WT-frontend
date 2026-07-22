import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ReferralFormSkeleton() {
  return (
    <Card className="overflow-hidden" aria-hidden>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-5 w-40" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        <div className="flex items-center gap-2">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-3 flex-1" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <div className="relative">
            <Skeleton className="absolute left-3 top-1/2 size-4 -translate-y-1/2 rounded-full" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <div className="relative">
            <Skeleton className="absolute left-3 top-1/2 size-4 -translate-y-1/2 rounded-full" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>

        <Skeleton className="h-11 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}
