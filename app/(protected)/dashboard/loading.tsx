import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-7 w-80" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-7 rounded-md" />
            </div>
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Upcoming Bookings Table */}
        <div className="lg:col-span-2 rounded-xl border">
          <div className="flex items-center justify-between p-4 border-b">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-20" />
          </div>

          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4 items-center">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16 ml-auto rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Pending Requests */}
        <div className="rounded-xl border p-4 space-y-4">
          <div className="space-y-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>

          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-dashed p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>

              <Skeleton className="h-5 w-20" />

              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-20" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-10" />
                  <Skeleton className="h-6 w-10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
