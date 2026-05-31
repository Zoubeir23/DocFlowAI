import { Skeleton } from "@/components/ui/skeleton";

export default function TablePageLoading() {
  return (
    <div className="p-6 space-y-5 max-w-[1400px] animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40 rounded-lg" />
            <Skeleton className="h-4 w-56 rounded-lg" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-64 rounded-lg" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="border-b border-border px-4 py-3 flex gap-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-16 rounded-lg" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-border/50">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32 rounded-lg" />
              <Skeleton className="h-3 w-24 rounded-lg" />
            </div>
            <Skeleton className="h-3.5 w-28 rounded-lg" />
            <Skeleton className="h-3.5 w-24 rounded-lg" />
            <Skeleton className="h-6 w-18 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
