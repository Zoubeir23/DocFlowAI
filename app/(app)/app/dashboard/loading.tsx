import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 max-w-[1400px] animate-in fade-in-0 duration-200">
      {/* Greeting */}
      <div className="space-y-1">
        <Skeleton className="h-7 w-64 rounded-lg" />
        <Skeleton className="h-4 w-40 rounded-lg" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-background p-5 space-y-3">
            <Skeleton className="h-4 w-20 rounded-lg" />
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-3 w-28 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[0, 1].map((idx) => (
          <div key={idx} className="rounded-2xl border border-border bg-background p-5 space-y-4">
            <Skeleton className="h-5 w-40 rounded-lg" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="w-8 h-8 rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32 rounded-lg" />
                  <Skeleton className="h-3 w-48 rounded-lg" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
