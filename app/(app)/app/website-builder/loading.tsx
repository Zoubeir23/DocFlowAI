import { Skeleton } from "@/components/ui/skeleton";

export default function WebsiteBuilderLoading() {
  return (
    <div className="flex h-full flex-col p-6 space-y-6 max-w-[1600px] animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 rounded-lg" />
            <Skeleton className="h-4 w-64 rounded-lg" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* Main content split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Sidebar editor */}
        <div className="lg:col-span-4 space-y-6">
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </div>

        {/* Preview area */}
        <div className="lg:col-span-8 bg-muted/20 rounded-2xl border border-border overflow-hidden">
          <Skeleton className="h-12 w-full rounded-t-2xl border-b border-border" />
          <div className="p-8 space-y-8">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <div className="grid grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
