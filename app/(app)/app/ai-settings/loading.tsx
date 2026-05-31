import { Skeleton } from "@/components/ui/skeleton";

export default function AISettingsLoading() {
  return (
    <div className="p-6 space-y-6 max-w-[1400px] animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-36 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
      </div>

      {/* URL banner */}
      <div className="rounded-2xl border border-border bg-background p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>

      {/* Code embed section */}
      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <Skeleton className="w-7 h-7 rounded-lg" />
          <Skeleton className="h-4 w-44 rounded-lg" />
        </div>
        <div className="p-5 space-y-4">
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      </div>

      {/* Widget appearance */}
      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <Skeleton className="w-7 h-7 rounded-lg" />
          <Skeleton className="h-4 w-36 rounded-lg" />
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-14 h-14 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-48 rounded-lg" />
              <div className="flex gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="w-7 h-7 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
