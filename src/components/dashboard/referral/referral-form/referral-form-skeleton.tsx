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
      <CardContent className="space-y-6 pt-0">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-wt-border-md p-8">
            <Skeleton className="size-12 rounded-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="mx-auto h-3 w-56" />
      </CardContent>
    </Card>
  );
}
