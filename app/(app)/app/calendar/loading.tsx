import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarLoading() {
  return (
    <div className="p-6 space-y-5 max-w-[1400px] animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32 rounded-lg" />
            <Skeleton className="h-4 w-48 rounded-lg" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        {/* Days header */}
        <div className="grid grid-cols-7 border-b border-border">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="p-3 border-r border-border last:border-r-0">
              <Skeleton className="h-4 w-12 rounded-lg mx-auto" />
            </div>
          ))}
        </div>
        {/* Calendar rows */}
        {Array.from({ length: 5 }).map((_, row) => (
          <div key={row} className="grid grid-cols-7 border-b border-border last:border-b-0">
            {Array.from({ length: 7 }).map((_, col) => (
              <div key={col} className="h-24 p-2 border-r border-border last:border-r-0">
                <Skeleton className="h-4 w-6 rounded-lg mb-2" />
                {(row + col) % 3 === 0 && <Skeleton className="h-5 w-full rounded-lg" />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
