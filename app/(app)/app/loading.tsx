import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="p-6 space-y-6 max-w-[1400px] animate-in fade-in-0 duration-300">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-lg" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-background p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded-lg" />
              <Skeleton className="w-9 h-9 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-3 w-32 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Content area */}
      <div className="rounded-2xl border border-border bg-background p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36 rounded-lg" />
              <Skeleton className="h-3 w-52 rounded-lg" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
