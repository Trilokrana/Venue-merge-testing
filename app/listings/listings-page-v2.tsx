"use client"

import { useJsApiLoader } from "@react-google-maps/api"
import * as React from "react"

import { useListings } from "@/components/common/hooks/useListings"
import Logo from "@/components/common/logo"
import ListingFiltersModal from "@/components/common/modals/ListingFiltersModal"
import { FilterOption, RenderToolbar } from "@/components/common/toolbar/RenderToolbar"
import UserProfile from "@/components/common/user-profile"
import { cleanFilters } from "@/components/data-table/utils"
import { VenueListingCard } from "@/components/listings/venue-listing-card"
import { VenueListingCardSkeleton } from "@/components/listings/venue-listing-card-skeleton"
import { VenueSearchBar } from "@/components/listings/venue-search-bar"
import { VenuesMap } from "@/components/listings/venues-map"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GlobalFooter } from "@/components/ui/global-footer"
import { AuthButtons } from "@/components/ui/global-header"
import { Label } from "@/components/ui/label"
import { PaginationWithLinks } from "@/components/ui/pagination-with-links"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useDebounce } from "@/hooks/use-debounce"
import { useModalControlQuery } from "@/hooks/use-modal-control-query"
import { useUser, UseUserResult } from "@/hooks/use-user"
import { capitalizeFirstLetter } from "@/lib/format"
import { Constants } from "@/lib/supabase/database.types"
import { cn } from "@/lib/utils"
import { ListingsFilters, ListingsWithRelations } from "@/schemas/listings.schema"
import { eventTypeEnum } from "@/schemas/venue.schema"
import { format } from "date-fns"
import { MapPin, SlidersHorizontal, Zap } from "lucide-react"
import Image from "next/image"
import { parseAsArrayOf, parseAsBoolean, parseAsInteger, parseAsString, useQueryState } from "nuqs"

const GOOGLE_MAPS_LIBRARIES = ["places"] as const

const filterOptions: FilterOption[] = [
  {
    key: "query",
    label: "Search",
    variant: "search",
    placeholder: "Search by name, or description",
  },
  {
    key: "venue_type",
    label: "Venue Type",
    variant: "select",
    options: Constants.public.Enums.venue_type.map((value) => ({
      label: capitalizeFirstLetter(value ?? ""),
      value,
    })),
  },
  {
    key: "event_type",
    label: "Event Type",
    variant: "select",
    options:
      eventTypeEnum.options?.map((option) => ({
        label: capitalizeFirstLetter(option ?? ""),
        value: option ?? "",
      })) ?? [],
  },
  {
    key: "indoor_outdoor",
    label: "Indoor/Outdoor",
    variant: "select",
    options: [
      {
        label: "All",
        value: "both",
      },
      {
        label: "Indoor",
        value: "indoor",
      },
      {
        label: "Outdoor",
        value: "outdoor",
      },
    ],
  },

  // Button: toggle for "instabook only"
  {
    key: "instabook",
    label: "Instant book",
    variant: "button",
    activeValue: true.toString(),
    icon: Zap,
  },
]

export function ListingsPageV2() {
  const { data: user, isLoading: isUserLoading } = useUser()
  const isUserProfileLoading = isUserLoading
  const filterDialog = useModalControlQuery("filter-dialog")
  const amenitiesDialog = useModalControlQuery("amenities-dialog")
  // Pagination + view-mode are owned by the page.
  const [page] = useQueryState("page", parseAsInteger.withDefault(1))
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(10))
  const [showMap, setShowMap] = useQueryState("showMap", parseAsBoolean.withDefault(true))

  // Search values are read from the URL — written by VenueSearchBar.
  const [planning, setPlanning] = useQueryState("planning", parseAsString.withDefault(""))
  const [place, setPlace] = useQueryState("place", parseAsString.withDefault(""))
  const [lat, setLat] = useQueryState("lat", parseAsInteger.withDefault(0))
  const [lng, setLng] = useQueryState("lng", parseAsInteger.withDefault(0))
  const [date, setDate] = useQueryState("date", parseAsString.withDefault(""))
  const [startTime, setStartTime] = useQueryState("startTime", parseAsString.withDefault(""))
  const [endTime, setEndTime] = useQueryState("endTime", parseAsString.withDefault(""))

  // Filter values are read from the URL — written by RenderToolbar.
  // No setters here; we never want the page to fight the toolbar over URL ownership.
  const [query] = useQueryState("query", parseAsString.withDefault(""))
  const [event_type] = useQueryState("event_type", parseAsArrayOf(parseAsString).withDefault([]))
  const [venue_type] = useQueryState("venue_type", parseAsString.withDefault(""))
  const [indoor_outdoor] = useQueryState("indoor_outdoor", parseAsString.withDefault(""))
  const [instabook] = useQueryState("instabook", parseAsBoolean.withDefault(false))
  const [price] = useQueryState("price", parseAsString.withDefault(""))
  const [capacity] = useQueryState("capacity", parseAsString.withDefault(""))
  const [min_hours] = useQueryState("min_hours", parseAsString.withDefault(""))
  const [amenities] = useQueryState("amenities", parseAsString.withDefault(""))
  const debouncedQuery = useDebounce(query, 800)

  const enableSearchVenueFilters = React.useMemo(() => {
    return (
      planning !== "" &&
      place !== "" &&
      lat &&
      lng &&
      date !== "" &&
      startTime !== "" &&
      endTime !== ""
    )
  }, [planning, place, date, startTime, endTime, lat, lng])

  const isMoreFiltersApplied =
    price !== "" || capacity !== "" || min_hours !== "" || amenities !== "" ? true : false

  const getMoreFiltersCount = () => {
    const data = {
      price,
      capacity,
      min_hours,
      amenities,
    }

    return Object.values(data).filter((value) => value !== "").length
  }

  // Inside ListingsPageV2

  const filters: ListingsFilters = React.useMemo(() => {
    // Parse "min,max" range strings into separate numbers
    const parseRange = (value: string): { min?: number; max?: number } => {
      if (!value) return {}
      const [minStr, maxStr] = value.split(",")
      const min = Number(minStr)
      const max = Number(maxStr)
      return {
        min: Number.isFinite(min) && min > 0 ? min : undefined,
        max: Number.isFinite(max) && max > 0 ? max : undefined,
      }
    }

    const capacityRange = parseRange(capacity)
    const priceRange = parseRange(price)

    // amenities in URL is comma-separated ("wifi,parking") → array
    const amenitiesArray = amenities
      ? amenities
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean)
      : undefined

    return cleanFilters({
      query: debouncedQuery,
      page,
      perPage,
      venue_type: venue_type || undefined,

      // Rename to match backend
      event_types: event_type.length > 0 ? event_type : undefined,

      indoor_outdoor: indoor_outdoor || undefined,
      instabook: instabook || undefined,

      // Capacity range → min/max
      min_capacity: capacityRange.min,
      max_capacity: capacityRange.max,

      // Price range → max hourly rate (use the upper bound)
      max_hourly_rate: priceRange.max,

      // min_hours stays as "min,max" string — backend handles the split
      min_hours: min_hours || undefined,

      amenities: amenitiesArray,

      // Availability search
      ...(enableSearchVenueFilters ? { planning, place, lat, lng, date, startTime, endTime } : {}),
    }) as ListingsFilters
  }, [
    page,
    perPage,
    debouncedQuery,
    venue_type,
    event_type,
    indoor_outdoor,
    instabook,
    price,
    capacity,
    min_hours,
    amenities,
    enableSearchVenueFilters,
    planning,
    place,
    lat,
    lng,
    date,
    startTime,
    endTime,
  ])

  const { data, isError, isLoading, isPending } = useListings(filters)

  const { items, meta } = data ?? { items: [], meta: { total: 0, page: 1, perPage: 10 } }
  console.log("🚀 ~ ListingsPageV2 ~ items:", items)

  const { isLoaded: mapsLoaded, loadError } = useJsApiLoader({
    id: "venue-booking-google",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    libraries: GOOGLE_MAPS_LIBRARIES as any,
  })

  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  const cardRefs = React.useRef<Record<string, HTMLDivElement | null>>({})
  // const state = useVenue(venues)

  const summaryPlace = "your area"
  // const summaryPlace = state.appliedPlace?.label ?? "your area"
  // const summaryEventLabel =
  //   state.appliedPlanning.trim().toLowerCase() === ALL_PLANNING.toLowerCase()
  //     ? "venues"
  //     : `${state.appliedPlanning.toLowerCase()} locations`

  // const selectedEventCount = state.filters.eventTypes.length

  const onMarkerClick = React.useCallback((id: string) => {
    setSelectedId(id)
    requestAnimationFrame(() => {
      cardRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    })
  }, [])

  React.useLayoutEffect(() => {
    if (filterDialog.state === true && typeof window !== "undefined") {
      filterDialog.set(false)
    }
    if (amenitiesDialog.state === false && typeof window !== "undefined") {
      amenitiesDialog.set(true)
    }
  }, [
    filterDialog.state,
    filterDialog.set,
    amenitiesDialog.state,
    amenitiesDialog.set,
    filterDialog,
    amenitiesDialog,
  ])

  return (
    <React.Fragment>
      <div className="min-h-screen bg-background text-base">
        <nav className="flex items-center justify-between px-0 sm:px-4 md:px-6 lg:px-8 sticky top-0 z-40 border-b bg-background">
          <div className="hidden md:block">
            <Logo />
          </div>
          <div className="mx-auto flex w-full max-w-7xl justify-center px-4 py-3 md:px-6 lg:px-8">
            <VenueSearchBar
              mapsLoaded={mapsLoaded && !loadError}
              planning={planning}
              onPlanningChange={setPlanning}
              place={{ lat, lng, label: place }}
              onPlaceChange={(p) => {
                setPlace(p?.label ?? "")
                setLat(p?.lat ?? 0)
                setLng(p?.lng ?? 0)
              }}
              date={date ? new Date(date) : undefined}
              onDateChange={(d) => {
                if (d) {
                  setDate(format(d, "yyyy-MM-dd"))
                } else {
                  setDate("")
                  setStartTime("")
                  setEndTime("")
                }
              }}
              startTime={startTime}
              endTime={endTime}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
              onSearch={() => {
                setSelectedId(null)
              }}
              className="w-full max-w-5xl"
              size="sm"
              searchButtonProps={{
                disabled: !enableSearchVenueFilters,
              }}
            />
          </div>
          <div className="hidden md:flex items-center justify-center">
            {isUserProfileLoading ? (
              <Skeleton className="w-10 h-10 rounded-full" />
            ) : user?.user ? (
              <UserProfile user={user as unknown as UseUserResult} />
            ) : (
              <AuthButtons showGetStarted={false} />
            )}
          </div>
        </nav>

        {/* <VenueFiltersDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={state.filters}
        onFiltersChange={state.setFilters}
        amenitiesOpen={amenitiesOpen}
        onAmenitiesOpenChange={setAmenitiesOpen}
        onApply={() => setFilterOpen(false)}
        onReset={state.resetFilters}
      /> */}

        <div className="mx-auto w-full px-4 py-6 md:px-6 lg:px-8">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-start gap-x-4 gap-y-0">
            <RenderToolbar
              className="border-b pb-4"
              customBlock={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault()
                    e.stopPropagation()
                    filterDialog.set(true)
                  }}
                  className="border-outline"
                >
                  <SlidersHorizontal className="size-3.5 shrink-0" />
                  More filters
                  {isMoreFiltersApplied && (
                    <Badge className="bg-primary rounded-full px-0 h-5 w-5 ml-1">
                      {getMoreFiltersCount()}
                    </Badge>
                  )}
                </Button>
              }
              filterOptions={filterOptions}
              onFiltersChange={(filters) => {
                console.log("🚀 ~ ListingsPageV2 ~ filters:", filters)
                if (filters["filter-dialog"] === "true") {
                  filterDialog.set(true)
                } else {
                  filterDialog.set(false)
                }
              }}
            >
              <div className="flex items-center gap-2 self-center min-h-8 h-full">
                <span className="inline-flex items-center gap-1 font-normal">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="line-clamp-1 text-xs">{summaryPlace}</span>
                </span>
                <div className="flex items-center gap-2">
                  <Switch
                    id="show-map"
                    size="lg"
                    checked={showMap}
                    onCheckedChange={setShowMap}
                    className="data-checked:bg-primary"
                  />
                  <Label htmlFor="show-map" className="text-xs font-medium">
                    Show map
                  </Label>
                </div>
              </div>
            </RenderToolbar>
          </div>

          <div
            className={
              showMap
                ? "flex flex-col-reverse gap-6 lg:flex-row lg:items-start lg:gap-8"
                : "flex flex-col gap-6"
            }
          >
            <div
              className={
                showMap
                  ? "min-h-0 min-w-0 w-full lg:flex-1 lg:basis-0 lg:min-w-0"
                  : "mx-auto w-full max-w-[1600px]"
              }
            >
              {isPending || isLoading ? (
                <div
                  className={
                    showMap
                      ? "grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 lg:gap-5 xl:grid-cols-3 items-stretch"
                      : "grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 lg:gap-5 items-stretch"
                  }
                >
                  {Array.from({ length: showMap ? 9 : 12 }).map((_, i) => (
                    <VenueListingCardSkeleton key={i} />
                  ))}
                </div>
              ) : isError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-10 text-sm text-red-700">
                  Something went wrong while loading venues. Please try again.
                </div>
              ) : items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center text-sm text-muted-foreground/80">
                  <Image src="/images/no-data-concept.png" alt="No Data" width={200} height={200} />
                  <h4 className="max-w-xl scroll-m-20 text-xl font-medium tracking-tight text-muted-foreground">
                    No venues match these filters. Try another event type or widen the location
                    search.
                  </h4>
                </div>
              ) : (
                <div
                  className={
                    showMap
                      ? "grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 lg:gap-5 xl:grid-cols-3"
                      : "grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 lg:gap-5"
                  }
                >
                  {items.map((venue: ListingsWithRelations) => (
                    <div
                      key={venue.id}
                      ref={(el) => {
                        cardRefs.current[venue.id ?? ""] = el
                      }}
                      className="h-full rounded-xl"
                      onMouseEnter={() => setSelectedId(venue.id ?? null)}
                    >
                      <VenueListingCard
                        venue={venue}
                        className={cn(
                          "w-full transition-colors hover:shadow-md",
                          isPending && "opacity-70"
                        )}
                        isOwnerView={
                          venue?.owner_id === user?.user?.id && user?.userType === "venue_owner"
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {showMap ? (
              <div className="flex w-full min-w-0 flex-col mb-2 lg:mb-0 lg:mt-0 lg:sticky lg:top-[68px] lg:h-[calc(100vh-80px)] lg:max-h-[calc(100vh-80px)] lg:w-[min(100%,360px)] lg:max-w-[360px] lg:shrink-0">
                <VenuesMap
                  venues={data?.items ?? []}
                  searchCenter={lat && lng ? { lat: lat, lng: lng } : null}
                  selectedId={selectedId}
                  onMarkerClick={onMarkerClick}
                  mapsLoaded={mapsLoaded}
                  mapsError={loadError ?? undefined}
                  className="h-full w-full flex-1 lg:min-h-0"
                />
              </div>
            ) : null}
          </div>

          <div className="mt-8">
            <PaginationWithLinks
              navigationMode="router"
              totalCount={meta.total}
              page={meta.page}
              pageSize={10}
              pageSearchParam="page"
              // onPageChange={(page) => setPage(page)}
              // pageSizeSelectOptions={{
              //   pageSizeSearchParam: "perPage",
              //   pageSizeOptions: [10, 20, 50, 100],
              // }}
            />
          </div>
        </div>
      </div>
      <ListingFiltersModal filterDialogControl={filterDialog} />
      <GlobalFooter />
    </React.Fragment>
  )
}
