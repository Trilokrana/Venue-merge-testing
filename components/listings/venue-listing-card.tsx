"use client"

import {
  formatLocationLine,
  formatShortLocation,
  normalizeAddress,
  primaryImageUrl,
} from "@/app/listings/data"
import { capitalizeFirstLetter } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ListingsWithRelations } from "@/schemas/listings.schema"
import { format } from "date-fns"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  MapPin,
  Star,
  Zap,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import * as React from "react"
import { Badge } from "../ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"

type Props = {
  venue: ListingsWithRelations
  className?: string
  isOwnerView?: boolean
  ownerCalendarLinked?: boolean
}

export function VenueListingCard({ venue, className, isOwnerView = false }: Props) {
  const [activeImageIndex, setActiveImageIndex] = React.useState(0)
  const addr = normalizeAddress(venue)
  const sortedImages = React.useMemo(() => {
    const list = venue.images ?? []
    return [...list].sort((a, b) => {
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1
      return a.sort_order - b.sort_order
    })
  }, [venue.images])
  const fallbackImage = primaryImageUrl(venue)
  const previewImages = React.useMemo(() => {
    if (sortedImages.length > 0) {
      return sortedImages.map((im) => ({ id: im.id, url: im.url }))
    }
    if (fallbackImage) {
      return [{ id: "fallback", url: fallbackImage }]
    }
    return []
  }, [sortedImages, fallbackImage])

  React.useEffect(() => {
    setActiveImageIndex(0)
  }, [venue.id])

  const title = venue.name
  const subtitle = formatShortLocation(addr) || formatLocationLine(addr)
  const currentIndex = React.useMemo(() => {
    if (previewImages.length === 0) return 0
    return activeImageIndex % previewImages.length
  }, [activeImageIndex, previewImages.length])

  const canSlide = previewImages.length > 1

  const goPrev = React.useCallback(() => {
    if (!canSlide) return
    setActiveImageIndex((prev) => (prev - 1 + previewImages.length) % previewImages.length)
  }, [canSlide, previewImages.length])

  const goNext = React.useCallback(() => {
    if (!canSlide) return
    setActiveImageIndex((prev) => (prev + 1) % previewImages.length)
  }, [canSlide, previewImages.length])

  const calendarOk = venue.calendar_sync === "connected"

  const dateLabel = venue.created_at ? format(venue.created_at, "EEE, MMM d, yyyy") : null
  const timeLabel =
    venue.created_at && venue.created_at
      ? `${format(venue.created_at, "h:mm a")} – ${format(venue.created_at, "h:mm a")}`
      : null

  return (
    <article
      className={cn(
        "group/card flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-md",
        className
      )}
    >
      <Link href={`/listings/${venue.slug || venue.id}`} className="group flex h-full flex-col">
        {/* Image / carousel */}
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden sm:aspect-[5/3]">
          {previewImages.length > 0 ? (
            <div
              className="flex h-full w-full transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {previewImages.map((im) => (
                <div key={im.id} className="relative h-full w-full shrink-0 overflow-hidden">
                  <Image
                    src={im.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="relative h-full w-full overflow-hidden bg-muted">
              <Image
                src="/venue-placeholder.svg"
                alt="No image available"
                fill
                className="object-contain p-6"
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
            </div>
          )}

          {/* Instant book badge */}
          {venue.instabook && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    className="absolute left-3 top-3 gap-1 border-primary/30 bg-background/95 px-2 py-1 text-primary shadow-sm backdrop-blur"
                    variant="outline"
                  >
                    <Zap className="size-3 fill-primary text-primary" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Instant book</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Rating pill */}
          {venue.rating != null && (
            <Badge
              className="absolute right-3 top-3 gap-1 border-transparent bg-background/95 px-2 py-1 text-foreground shadow-sm backdrop-blur"
              variant="outline"
            >
              <Star className="size-3 fill-amber-400 text-amber-400" />
              {venue.rating.toFixed(2)}
            </Badge>
          )}

          {canSlide && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  goPrev()
                }}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white opacity-0 shadow transition-all hover:bg-black/70 group-hover:opacity-100"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  goNext()
                }}
                aria-label="Next image"
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white opacity-0 shadow transition-all hover:bg-black/70 group-hover:opacity-100"
              >
                <ChevronRight className="size-4" />
              </button>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          {/* Title + type */}
          <div className="flex items-start justify-between gap-2">
            <h2 className="line-clamp-1 text-[17px] font-semibold leading-tight tracking-tight text-foreground">
              {title}
            </h2>
            {venue.venue_type && (
              <Badge
                variant="outline"
                className="shrink-0 border-border bg-muted/60 text-[11px] font-medium text-muted-foreground"
              >
                {capitalizeFirstLetter(venue.venue_type)}
              </Badge>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span className="line-clamp-1">{subtitle || "Location unavailable"}</span>
          </div>

          {/* Info block */}
          {(dateLabel || timeLabel) && (
            <div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-4 py-3">
              {dateLabel && venue?.description && (
                <div className="flex items-start gap-2 text-sm">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-1 font-medium text-foreground">
                    {venue.description}
                  </span>
                </div>
              )}
              {timeLabel && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{timeLabel}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Footer (always present — consistent card height) */}
      {isOwnerView ? (
        <div className="mt-auto flex items-center justify-between border-t border-border/60 px-4 py-3">
          <a
            href={`/api/cronofy/start-connect?venue_id=${venue.id}`}
            target="_top"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium transition-colors",
              calendarOk
                ? "text-green-600 hover:text-green-700 dark:text-green-400"
                : "text-primary hover:text-primary/80"
            )}
          >
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full",
                calendarOk ? "bg-green-100 dark:bg-green-950" : "bg-primary/10"
              )}
            >
              <CalendarDays className="size-3" aria-hidden />
            </span>
            {calendarOk ? "Connected" : "Sync calendar"}
          </a>

          <Link
            href={`/venues/${venue.id}/calendar`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            View availability
            <span aria-hidden>→</span>
          </Link>
        </div>
      ) : (
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/60 px-4 py-3">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold tracking-tight text-foreground">
              ${Number(venue.hourly_rate ?? 10).toLocaleString()}
            </span>
            <span className="text-xs font-medium text-muted-foreground">USD/hr</span>
          </div>

          {venue.capacity && (
            <span className="text-xs text-muted-foreground">Up to {venue.capacity} guests</span>
          )}
        </div>
      )}
    </article>
  )
}
