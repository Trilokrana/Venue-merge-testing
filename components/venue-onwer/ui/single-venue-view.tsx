import { formatLocationLine } from "@/app/listings/data"
import ErrorState from "@/components/common/ErrorState"
import { VenueDetailGallery } from "@/components/listings/venue-detail-gallery"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useDeleteMyVenue } from "@/components/venue-onwer/hooks/useMyVenues"
import { DeleteVenueModal } from "@/components/venue-onwer/modal/DeleteVenueModal"
import { EditVenueModal } from "@/components/venue-onwer/modal/EditVenueModal"
import { VenueFormOutput } from "@/form/update-venues"
import { useModalControlQuery } from "@/hooks/use-modal-control-query"
import { VenueAddress, VenueWithRelations } from "@/lib/venues/types"
import {
  ArrowLeft,
  BookText,
  CalendarDays,
  CheckCircle2,
  Clock,
  Expand,
  ExternalLink,
  Globe2,
  HousePlus,
  MapPin,
  Pencil,
  ShieldCheck,
  TicketCheck,
  Trash,
  Users,
  Zap,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Fragment, useMemo, useState } from "react"
import { toast } from "sonner"

import VenueDetailLoading from "@/app/listings/[slug]/loading"
import { formatVenueType } from "@/app/listings/data"
import { VenueDetailMap } from "@/components/listings/venue-detail-map"
import IconWrapper from "@/components/ui/icon-wrapper"
import { Rating } from "@/components/ui/rating"
import Link from "next/link"

const SingleVenueView = ({
  venue,
  isLoading,
  isError,
  errorMessage,
  showEditButton = true,
  showDeleteButton = true,
  showCalendarButton = true,
  showBackButton = true,
}: {
  venue: VenueWithRelations | null | undefined
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  showEditButton?: boolean
  showDeleteButton?: boolean
  showCalendarButton?: boolean
  showBackButton?: boolean
}) => {
  console.log("🚀 ~ SingleVenueView ~ venue:", venue)
  const { mutateAsync: deleteVenue, isPending: isPendingDeleteVenue } = useDeleteMyVenue()
  const router = useRouter()

  const calendarOk = venue?.calendar_sync === "connected"
  const isBooked = venue?.is_booked === true

  const deleteDialog = useModalControlQuery("delete-venue-details")
  const editDialog = useModalControlQuery("edit-venue-details")

  const [selectedVenue, setSelectedVenue] = useState<VenueWithRelations | null>(null)
  const [photosOpen, setPhotosOpen] = useState(false)
  const [index, setIndex] = useState(-1)
  const galleryImages = venue?.images?.map((image) => ({ id: image.id, url: image.url ?? "" })) ?? [
    { id: "hero-fallback", url: "" },
  ]

  const socialLinks = useMemo(() => {
    const links = (venue?.social_media_links ?? []).filter((u): u is string => Boolean(u?.trim()))
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
  }, [venue?.social_media_links])

  if (isLoading) return <VenueDetailsSkeleton />

  if (isError)
    return (
      <ErrorState
        title="Something went wrong while loading this venue."
        description={errorMessage ?? "Something went wrong while loading this venue."}
      />
    )

  return (
    <Fragment>
      {showBackButton && (
        <Button
          className="mb-4 sticky top-0"
          variant="secondary"
          size="sm"
          onClick={() => router.push("/venues")}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
      )}
      <div className="mx-auto w-full max-w-6xl">
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
              {formatVenueType(venue?.venue_type ?? "")}
            </Badge>
            {venue?.instabook ? (
              <Badge variant="instabook" aria-label="Instabook">
                <Zap className="size-3" />
                Instant book
              </Badge>
            ) : null}
            <div className="flex items-center gap-2">
              {showEditButton && (
                <Button
                  variant={"outline"}
                  size="icon-xs"
                  className="border-green-500"
                  onClick={() => {
                    if (venue) {
                      setSelectedVenue(venue as VenueWithRelations)
                      editDialog.set(true)
                    }
                  }}
                >
                  <Pencil className="h-4 w-4 text-green-500" />
                </Button>
              )}
              {showDeleteButton && (
                <Button
                  variant={"outline"}
                  size="icon-xs"
                  className="border-destructive"
                  onClick={() => {
                    setSelectedVenue(venue as VenueWithRelations)
                    deleteDialog.set(true)
                  }}
                >
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
          <h1 className="wrap-break-word text-2xl font-semibold tracking-tight md:text-3xl">
            {venue?.name}
          </h1>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {venue?.rating && <Rating value={venue?.rating || 0} readOnly />}
            <span className="inline-flex items-center gap-1 ">
              <MapPin className="size-4 shrink-0" />
              {formatLocationLine(venue?.addresses as VenueAddress)}
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
                    {venue?.min_hours != null ? `${venue?.min_hours ?? 0} hr minimum` : "Ask host"}
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
                    {venue?.capacity != null
                      ? `${venue?.capacity.toLocaleString()} people`
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
                    {venue?.square_footage != null
                      ? `${venue?.square_footage.toLocaleString()} sq/ft`
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
                <BookText className="size-4 text-muted-foreground mt-1.5 w-4" />
                <div className="space-y-0 w-full">
                  <p className="text-lg font-semibold">About this space</p>
                  {venue?.description ? (
                    <p>{venue?.description}</p>
                  ) : (
                    <p className="text-muted-foreground">
                      The host has not added a description yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {venue?.amenities?.length && venue?.amenities?.length > 0 ? (
              <Card size="sm" className="shadow-sm">
                <CardContent className="text-sm leading-relaxed flex flex-col sm:flex-row items-start gap-2 sm:gap-4">
                  <HousePlus className="size-4 text-muted-foreground mt-1.5 min-w-4" />
                  <div className="space-y-2 sm:space-y-2.5 w-full">
                    <p className="text-lg font-semibold">Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {venue?.amenities?.map((a) => (
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

            <div className="grid gap-4 md:grid-cols-1">
              <Card size="sm" className="shadow-sm">
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-3">
                      <IconWrapper variant="secondary">
                        <Clock className="size-4 text-muted-foreground" />
                      </IconWrapper>

                      <div className="min-w-0">
                        <p className="text-md font-semibold">Hours</p>
                        <p className="mt-0.5 text-sm leading-snug">
                          {venue?.hours_of_operation ?? "Ask the host"}
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
                          {venue?.cancellation_policy ?? "Ask the host"}
                        </p>
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
                            href={link?.href ?? ""}
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
              <div className="space-y-3">
                {showCalendarButton && (
                  <div className="space-y-3">
                    {/* Left */}
                    <div className="gap-2 min-w-0">
                      <Button
                        asChild
                        variant={calendarOk ? "default" : "outline"}
                        size="sm"
                        className="gap-2 w-full"
                      >
                        <a
                          href={`/api/cronofy/start-connect?venue_id=${venue?.id}`}
                          target="_top"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <CalendarDays className="size-4" />

                          {calendarOk ? (
                            <>
                              <CheckCircle2 className="size-4 text-green-500" />
                              Connected
                            </>
                          ) : (
                            "Connect Calendar"
                          )}
                        </a>
                      </Button>

                      {/* Status text */}
                      <span className="text-xs text-muted-foreground truncate">
                        {calendarOk
                          ? "Your calendar is synced"
                          : "Sync your calendar to manage availability"}
                      </span>
                    </div>

                    {/* Right */}
                    <Button asChild variant="secondary" size="sm" className="w-full">
                      <Link
                        href={`/venues/${venue?.id}/calendar`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-xs text-muted-foreground"
                      >
                        Availability
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {deleteDialog.state && (
        <DeleteVenueModal
          isLoading={isPendingDeleteVenue}
          venue={selectedVenue as VenueWithRelations}
          dialogControl={deleteDialog}
          onConfirm={async (id) => {
            const result = await deleteVenue(id as string)

            if (result) {
              deleteDialog.set(false)
              toast.success("Venue deleted successfully")
              router.push("/venues")
              router.refresh()
            } else {
              toast.error("Failed to delete venue")
            }
          }}
        />
      )}

      {editDialog?.state && (
        <EditVenueModal
          venue={selectedVenue as VenueWithRelations}
          dialogControl={editDialog}
          onSuccess={(data: VenueFormOutput) => {
            if (data.slug !== venue?.slug) {
              setTimeout(() => {
                router.replace(`/venues/${data.slug}`)
              }, 100)
            }
          }}
        />
      )}
    </Fragment>
  )
}

export default SingleVenueView

const VenueDetailsSkeleton = () => {
  return <VenueDetailLoading />
}
