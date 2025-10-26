import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DocumentLoadingSkeleton() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </Card>
    </div>
  );
}

export function SpreadsheetLoadingSkeleton() {
  return (
    <div className="container mx-auto p-4">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex gap-2">
              {Array.from({ length: 8 }).map((_, j) => (
                <Skeleton key={j} className="h-8 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function PresentationLoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </Card>
    </div>
  );
}
