import { Skeleton } from "@/components/ui/skeleton"

export default function ListingsSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* 🔍 Search Bar */}
      <div className="rounded-2xl border p-3 sm:p-4 flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-full sm:w-[120px] rounded-lg" />
      </div>

      {/* 🎛 Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-full" />
        ))}

        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-10 rounded-full" />
        </div>
      </div>

      {/* 📦 Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 🧱 Cards Grid */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-2xl border overflow-hidden p-3 space-y-3">
              {/* Image */}
              <Skeleton className="h-[140px] sm:h-[160px] w-full rounded-xl" />

              {/* Title */}
              <Skeleton className="h-4 w-3/4" />

              {/* Location */}
              <Skeleton className="h-3 w-1/2" />

              {/* Description */}
              <Skeleton className="h-10 w-full rounded-md" />

              {/* Time */}
              <Skeleton className="h-3 w-1/3" />

              {/* Footer */}
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>

        {/* 🗺 Map (Hidden on small screens) */}
        <div className="hidden lg:block">
          <Skeleton className="h-[600px] w-full rounded-2xl" />
        </div>
      </div>

      {/* 🔢 Pagination */}
      <div className="flex items-center justify-center gap-2 pt-4">
        <Skeleton className="h-8 w-20 rounded-md" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded-md" />
        ))}
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </div>
  )
}
