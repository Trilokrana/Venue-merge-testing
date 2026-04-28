import { Skeleton } from "@/components/ui/skeleton"

export default function VenueDetailLoading() {
  return (
    <div className="space-y-5 sm:space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left: Big Image */}
        <Skeleton className="h-[200px] sm:h-[260px] w-full rounded-2xl" />

        {/* Right: Image Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Skeleton className="h-[90px] sm:h-[120px] rounded-xl" />
          <Skeleton className="h-[90px] sm:h-[120px] rounded-xl" />
          <Skeleton className="col-span-2 h-[90px] sm:h-[120px] rounded-xl" />
        </div>
      </div>

      {/* Title + Info */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>

        <Skeleton className="h-6 sm:h-7 w-3/4 sm:w-64" />
        <Skeleton className="h-4 w-full sm:w-96" />

        {/* Stats Row */}
        <div className="flex flex-wrap gap-3 sm:gap-6 pt-2">
          <Skeleton className="h-10 w-[45%] sm:w-28 rounded-lg" />
          <Skeleton className="h-10 w-[45%] sm:w-28 rounded-lg" />
          <Skeleton className="h-10 w-[45%] sm:w-28 rounded-lg" />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* About */}
          <div className="rounded-2xl border p-3 sm:p-4 space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>

          {/* Amenities */}
          <div className="rounded-2xl border p-3 sm:p-4 space-y-3">
            <Skeleton className="h-5 w-32" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-20 sm:w-24 rounded-full" />
              ))}
            </div>
          </div>

          {/* Hours + Cancellation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-2xl border p-3 sm:p-4 space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>

            <div className="rounded-2xl border p-3 sm:p-4 space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>

          {/* Social */}
          <div className="rounded-2xl border p-3 sm:p-4 space-y-3">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-3/4 sm:w-48" />
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Manage Card */}
          <div className="rounded-2xl border p-3 sm:p-4 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>

          {/* Host Card */}
          <div className="rounded-2xl border p-3 sm:p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
