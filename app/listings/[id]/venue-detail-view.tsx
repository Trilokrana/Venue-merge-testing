"use client"

import {
  BookText,
  Clock,
  Expand,
  ExternalLink,
  Globe2,
  HousePlus,
  Info,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  TicketCheck,
  Users,
  Zap,
} from "lucide-react"
import Link from "next/link"
import * as React from "react"

import {
  formatLocationLine,
  formatVenueType,
  normalizeAddress,
  primaryImageUrl,
} from "@/app/listings/data"
import { VenueBookingWidget } from "@/components/listings/venue-booking-widget"
import { VenueDetailGallery } from "@/components/listings/venue-detail-gallery"
import { VenueDetailMap } from "@/components/listings/venue-detail-map"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import IconWrapper from "@/components/ui/icon-wrapper"
import { Rating } from "@/components/ui/rating"
import { Separator } from "@/components/ui/separator"
import type { VenueWithRelations } from "@/lib/venues/types"
import { Settings } from "lucide-react"

type Props = {
  venue: VenueWithRelations
  /** True when the logged-in user is this venue's owner. */
  isOwner?: boolean
}

export function VenueDetailView({ venue, isOwner = false }: Props) {
  const [index, setIndex] = React.useState<number>(-1)
  const [photosOpen, setPhotosOpen] = React.useState(false)
  const addr = normalizeAddress(venue)
  const owner = Array.isArray(venue.owner) ? venue.owner[0] : venue.owner
  const hostName = owner?.display_name?.trim() || "Host"
  const hostInitials =
    hostName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "H"
  const imgs = React.useMemo(() => {
    const list = [...(venue.images ?? [])].sort((a, b) => a.sort_order - b.sort_order)
    return list.map((im) => ({ id: im.id, url: im.url }))
  }, [venue.images])

  const heroFallback = primaryImageUrl(venue)

  const overlayImages = React.useMemo(() => {
    if (imgs.length > 0) return imgs
    if (heroFallback) return [{ id: "hero-fallback", url: heroFallback }]
    return []
  }, [imgs, heroFallback])

  const galleryImages = React.useMemo(() => {
    if (imgs.length > 0) return imgs
    if (heroFallback) return [{ id: "hero-fallback", url: heroFallback }]
    return []
  }, [imgs, heroFallback])

  const socialLinks = React.useMemo(() => {
    const links = (venue.social_media_links ?? []).filter((u): u is string => Boolean(u?.trim()))
    return links.map((raw) => {
      const trimmed = raw.trim()
      const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
      let label = trimmed
      try {
        const host = new URL(href).hostname.replace(/^www\./i, "")
        label = host || trimmed
      } catch {
        label = trimmed
      }
      return { href, label }
    })
  }, [venue.social_media_links])

  return (
    <div className="min-h-screen">
      {/* <div className="border-b">
          <div className="w-full px-4 py-3 md:px-6 lg:px-8">
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link href="/listings">
                <ArrowLeft className="size-4" />
                Back to listings
              </Link>
            </Button>
          </div>
        </div> */}

      <div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-8 md:px-6 md:pt-6 md:pb-12">
        <VenueDetailGallery
          images={galleryImages}
          onShowAll={() => setPhotosOpen(true)}
          openOverlay={photosOpen}
          onCloseOverlay={() => setPhotosOpen(false)}
          photoIndex={index}
          setPhotoIndex={setIndex}
          onGalleryImageClick={(index) => {
            setIndex(index)
          }}
        />
        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="venue_type" aria-label="Venue type">
              {formatVenueType(venue.venue_type)}
            </Badge>
            {venue.instabook ? (
              <Badge variant="instabook" aria-label="Instabook">
                <Zap className="size-3" />
                Instant book
              </Badge>
            ) : null}
          </div>
          <h1 className="wrap-break-word text-2xl font-semibold tracking-tight md:text-3xl">
            {venue.name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {venue.rating && <Rating value={venue.rating || 0} readOnly />}
            <span className="inline-flex items-center gap-1 ">
              <MapPin className="size-4 shrink-0" />
              {formatLocationLine(addr)}
            </span>
          </div>
          <div className="border-y py-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-4">
                <IconWrapper variant="secondary">
                  <TicketCheck className="size-4 text-muted-foreground" />
                </IconWrapper>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Min booking length</p>
                  <p className="text-xl font-bold">
                    {venue.min_hours != null ? `${venue.min_hours} hr minimum` : "Ask host"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <IconWrapper variant="secondary">
                  <Users className="size-4 text-muted-foreground" />
                </IconWrapper>

                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Cast & Crew</p>
                  <p className="text-xl font-bold">
                    {venue.capacity != null
                      ? `${venue.capacity.toLocaleString()} people`
                      : "Ask host"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <IconWrapper variant="secondary">
                  <Expand className="size-4 text-muted-foreground" />
                </IconWrapper>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Square footage</p>
                  <p className="text-xl font-bold">
                    {venue.square_footage != null
                      ? `${venue.square_footage.toLocaleString()} sq/ft`
                      : "Ask host"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-col-reverse gap-4 lg:grid lg:grid-cols-[1fr_380px] lg:items-start lg:gap-4">
          <div className="min-w-0 space-y-4">
            <Card size="sm" className="shadow-sm">
              <CardContent className="text-sm leading-relaxed flex flex-col sm:flex-row items-start gap-2 sm:gap-4">
                <BookText className="size-4 text-muted-foreground mt-1.5" />
                <div className="space-y-0">
                  <p className="text-lg font-semibold">About this space</p>
                  {venue.description ? (
                    <p>{venue.description}</p>
                  ) : (
                    <p className="text-muted-foreground">
                      The host has not added a description yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {venue.amenities?.length && venue.amenities.length > 0 ? (
              <Card size="sm" className="shadow-sm">
                <CardContent className="text-sm leading-relaxed flex flex-col sm:flex-row items-start gap-2 sm:gap-4">
                  <HousePlus className="size-4 text-muted-foreground mt-1.5 min-w-4" />
                  <div className="space-y-2 sm:space-y-2.5">
                    <p className="text-lg font-semibold">Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {venue.amenities.map((a) => (
                        <Badge
                          key={a}
                          variant="secondary"
                          className="rounded-full p-3 font-normal capitalize "
                        >
                          {a.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <Card size="sm" className="shadow-sm">
                <CardContent className="flex flex-col gap-4">
                  <div className="flex gap-3">
                    <IconWrapper variant="secondary">
                      <Clock className="size-4 text-muted-foreground" />
                    </IconWrapper>

                    <div className="min-w-0">
                      <p className="text-md font-semibold">Hours</p>
                      <p className="mt-0.5 text-sm leading-snug">
                        {venue.hours_of_operation ?? "Ask the host"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 border-t pt-4">
                    <IconWrapper variant="secondary">
                      <ShieldCheck className="size-4 text-muted-foreground" />
                    </IconWrapper>

                    <div className="min-w-0">
                      <p className="text-md font-semibold">Cancellation</p>
                      <p className="mt-0.5 text-sm leading-snug">
                        {venue.cancellation_policy ?? "Ask the host"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card size="sm" className="shadow-sm">
                <CardContent>
                  {/* Header */}
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <Avatar className="size-10 border-2 shadow-sm">
                        <AvatarImage src={owner?.photo_url ?? undefined} alt={hostName} />
                        <AvatarFallback className="bg-muted text-sm font-semibold">
                          {hostInitials}
                        </AvatarFallback>
                      </Avatar>

                      {/* Online indicator */}
                      <span className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 ring-2 ring-white" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Your Host</p>
                      <p className="truncate text-base font-semibold">{hostName}</p>
                    </div>
                  </div>

                  {/* Divider */}

                  <Separator className="my-4 border-0" />

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2">
                      {venue.rating && <Rating value={venue.rating || 0} readOnly />}
                      <div>
                        <p className="text-[10px] text-muted-foreground">Rating</p>
                        <p className="text-sm font-semibold">{venue.rating?.toFixed(2) || "N/A"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2">
                      <MessageCircle className="size-4 text-blue-500" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Response</p>
                        <p className="text-sm font-semibold">Within a day</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {socialLinks.length > 0 ? (
              <Card size="sm" className="shadow-sm">
                <CardContent className="text-sm leading-relaxed flex flex-col sm:flex-row items-start gap-2 sm:gap-4">
                  <Globe2 className="size-4 text-muted-foreground mt-1.5 min-w-4" />
                  <div className="space-y-2 sm:space-y-2.5">
                    <p className="text-lg font-semibold"> Social Media</p>
                    <ul className="space-y-1">
                      {socialLinks.map((link, index) => (
                        <li key={index}>
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:text-blue-600 underline-offset-2  hover:underline"
                          >
                            {link.label}
                            <ExternalLink className="size-3.5" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {venue?.addresses &&
            "lat" in venue?.addresses &&
            "lng" in venue?.addresses &&
            venue?.addresses?.lat != null &&
            venue?.addresses?.lng != null ? (
              <Card
                size="sm"
                className="overflow-hidden shadow-sm data-[size=sm]:gap-0 data-[size=sm]:pb-0"
              >
                <h2 className="border-b px-4 pb-4 text-base font-semibold">Location</h2>
                <VenueDetailMap
                  lat={venue?.addresses?.lat as number}
                  lng={venue?.addresses?.lng as number}
                  title={venue?.name ?? ""}
                  className="rounded-none border-0 border-t-0 shadow-none"
                />
              </Card>
            ) : null}
          </div>

          <Card size="sm" className="shadow-sm lg:sticky lg:top-6 lg:self-start">
            <CardContent>
              <div>
                {isOwner ? (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
                    <p className="text-sm font-semibold text-foreground">This is your venue</p>
                    <p className="text-sm text-muted-foreground">
                      You can manage settings, connect your calendar, and view incoming bookings.
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button asChild className="w-full">
                        <Link href={`/venues/${venue.id}/calendar-sync`}>
                          <Settings className="mr-2 size-4" />
                          Manage calendar sync
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/bookings">View bookings</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <VenueBookingWidget
                      venueId={venue.id}
                      hourlyRate={venue.hourly_rate}
                      minHours={venue.min_hours}
                      capacity={venue.capacity}
                      className="rounded-none"
                    />
                    {venue.phone?.[0] ? (
                      <Button
                        className="mt-4 w-full gap-2"
                        variant="outline"
                        asChild
                      >
                        <a href={`tel:${venue.phone[0]}`}>
                          <Phone className="size-4" />
                          Call {venue.phone[0]}
                        </a>
                      </Button>
                    ) : null}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
