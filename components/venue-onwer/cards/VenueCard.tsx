// components/VenueCard.tsx
"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Rating } from "@/components/ui/rating"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { capitalizeFirstLetter } from "@/lib/format"
import { cn } from "@/lib/utils"
import { VenueAddress, VenueImage, VenueWithRelations } from "@/lib/venues/types"
import {
  CalendarDays,
  Clock,
  DollarSign,
  Eye,
  MapPin,
  Pencil,
  Trash,
  Users,
  Zap,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
// import { VenueEditForm } from "./VenueEditForm";
// import { formatCurrency, formatNumber } from "@/lib/utils";

interface VenueCardProps {
  venue: VenueWithRelations
  onView?: (venue: VenueWithRelations) => void
  onDelete?: (venue: VenueWithRelations) => void
  onEdit?: (venue: VenueWithRelations) => void
  className?: string
  variant?: "default" | "list"
  isOwnerView?: boolean
  ownerCalendarLinked?: boolean
}

function primaryAddress(addresses: VenueWithRelations["addresses"]): VenueAddress | null {
  if (!addresses) return null
  return Array.isArray(addresses) ? (addresses[0] ?? null) : addresses
}

export function VenueCard({
  venue,
  onDelete,
  onEdit,
  onView,
  className,
  variant = "default",
  isOwnerView = true,
  ownerCalendarLinked = false,
}: VenueCardProps) {
  const addr = primaryAddress(venue?.addresses)

  const featuredImage: VenueImage | null = Array.isArray(venue?.images)
    ? venue?.images.length > 0
      ? venue?.images[0]
      : venue?.images[0]
    : null

  const isListVarinat = variant === "list"

  // const priceLine =
  //   venue.hourly_rate != null ? `$${venue.hourly_rate.toLocaleString()} USD/hr` : "Request pricing"
  const calendarOk = venue?.calendar_sync === "connected"
  const isBooked = venue?.is_booked === true

  return (
    <Card
      className={cn(
        "group/item relative overflow-hidden p-0 gap-0 transition-all duration-300 hover:-translate-y-0.1 hover:shadow-lg",
        isListVarinat && "grid grid-cols-[40%_60%]",
        className
      )}
    >
      {/* Image Section */}
      <div
        className={cn(
          "relative h-48 w-full overflow-hidden bg-background",
          isListVarinat ? "h-full max-h-[240px]" : "aspect-16/10"
        )}
      >
        {featuredImage ? (
          <Image
            src={featuredImage?.url ?? ""}
            alt={venue?.name}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover/item:scale-[1.04]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-linear-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800">
            <MapPin className="h-10 w-10 text-muted-foreground" />
          </div>
        )}

        {/* Top-left status badge */}
        {isBooked && (
          <div className="absolute left-3 bottom-3">
            <Badge variant="instabook" className="text-xs font-medium">
              Booked
            </Badge>
          </div>
        )}

        {/* Instant book badge */}
        {venue?.instabook && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className="absolute left-3 top-3" variant="instabook">
                  <Zap className="size-3 fill-primary text-primary" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Instant book</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Hover action toolbar */}
        {(onView || onEdit || onDelete) && (
          <div className="absolute top-3 right-3 flex flex-col items-center gap-1 rounded-full p-1 opacity-0 backdrop-blur transition-all duration-200 group-hover/item:opacity-100 dark:bg-neutral-900/95">
            {onView && typeof onView === "function" && (
              <Button
                variant={"outline"}
                size="icon-xs"
                onClick={() => onView?.(venue)}
                className="h-7 w-7 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {onEdit && typeof onEdit === "function" && (
              <Button
                variant={"outline"}
                size="icon-xs"
                onClick={() => onEdit?.(venue)}
                className="h-7 w-7 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && typeof onDelete === "function" && (
              <Button
                variant={"outline"}
                size="icon-xs"
                onClick={() => onDelete?.(venue)}
                className="h-7 w-7 rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content Section */}
      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-col gap-1.5">
          {/* Title */}
          <div className="flex items-start justify-between gap-2">
            {isOwnerView ? (
              <Link
                href={`/venues/${venue?.slug}`}
                className="line-clamp-1 text-[17px] font-semibold leading-tight tracking-tight text-foreground"
              >
                {venue?.name}
              </Link>
            ) : (
              <h2 className="line-clamp-1 text-[17px] font-semibold leading-tight tracking-tight text-foreground">
                {venue?.name}
              </h2>
            )}
            {venue?.venue_type && (
              <Badge variant="venue_type">{capitalizeFirstLetter(venue?.venue_type)}</Badge>
            )}
          </div>
          {/* Description */}
          {venue?.description && (
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-1">
              {venue.description}
            </p>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center justify-between gap-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{addr?.street ?? "Location unavailable"}</span>
          </div>

          {venue?.rating && (
            <div className="flex items-center gap-1">
              <Rating readOnly value={venue?.rating || 0} />
            </div>
          )}
        </div>

        {/* Meta row: capacity / rate / min hours */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {venue?.capacity && (
            <div className="flex items-center gap-1.5 border rounded-full px-2 py-1 text-xs">
              <Users className="h-4 w-4" />
              <span>Up to {venue?.capacity}</span>
            </div>
          )}
          {venue?.hourly_rate && (
            <div className="flex items-center gap-1.5 font-medium text-muted-foreground border rounded-full px-2 py-1 text-xs">
              <DollarSign className="h-4 w-4" />
              <span>
                {venue?.hourly_rate}
                <span className="font-normal">/hr</span>
              </span>
            </div>
          )}
          {venue?.min_hours && (
            <div className="flex items-center gap-1.5  border rounded-full px-2 py-1 text-xs">
              <Clock className="h-4 w-4" />
              <span>Min {venue?.min_hours}h</span>
            </div>
          )}
        </div>

        {/* Owner Footer */}
        {isOwnerView && (
          <div className="mt-0 flex items-center justify-between gap-3 border-t pt-3">
            <a
              href={
                calendarOk
                  ? `/venues/${venue.id}/calendar-sync`
                  : `/api/cronofy/start-connect?venue_id=${venue.id}`
              }
              target="_top"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium transition-colors",
                calendarOk
                  ? "text-green-700 hover:text-green-800 dark:text-green-400"
                  : "text-primary hover:text-primary/80"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full",
                  calendarOk ? "bg-green-100 dark:bg-green-950" : "bg-primary/10"
                )}
              >
                <CalendarDays className="h-3 w-3" aria-hidden />
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
        )}
      </CardContent>
    </Card>
  )
}
