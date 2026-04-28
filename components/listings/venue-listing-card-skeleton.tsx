import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type Props = {
  className?: string
}

export function VenueListingCardSkeleton({ className }: Props) {
  return (
    <article className={cn("overflow-hidden rounded-2xl border bg-background", className)}>
      {/* Image */}
      <div className="relative h-[180px] sm:h-[210px] overflow-hidden rounded-t-2xl">
        <Skeleton className="h-full w-full" />

        {/* Top-left badge (instant book icon) */}
        <div className="absolute left-2 top-2">
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3 p-3">
        {/* Title + Tag */}
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>

        {/* Location */}
        <Skeleton className="h-4 w-1/2" />

        {/* Description Box */}
        <div className="rounded-xl border p-3 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </article>
  )
}
