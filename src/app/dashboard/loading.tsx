import { Skeleton } from "@/components/ui/skeleton";
import { PageCard } from "@/components/ui/page-card";

export default function DashboardLoading() {
  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-300">
      <PageCard className="h-full min-h-[calc(100vh-8rem)]">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </PageCard>
    </div>
  );
}
