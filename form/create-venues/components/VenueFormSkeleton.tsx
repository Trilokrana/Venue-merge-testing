import { Skeleton } from "@/components/ui/skeleton"

export const VenueFormSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Venue Name */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Venue Type */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>

      {/* Event Types */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        <div className="space-y-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    </div>
  )
}
