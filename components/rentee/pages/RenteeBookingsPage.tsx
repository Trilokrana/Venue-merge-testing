"use client"

import { RenderToolbar, type FilterOption } from "@/components/common/toolbar/RenderToolbar"
import { cleanFilters } from "@/components/data-table/utils"
import BookingsPageSkeleton from "@/components/rentee/skeletons/BookingsPageSkeleton"
import { PaginationWithLinks } from "@/components/ui/pagination-with-links"
import { useSidebar } from "@/components/ui/sidebar"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useDebounce } from "@/hooks/use-debounce"
import { BookingWithRelations } from "@/lib/bookings/types"
import { capitalizeFirstLetter } from "@/lib/format"
import { Constants } from "@/lib/supabase/database.types"
import { cn } from "@/lib/utils"
import { BookingFilters } from "@/schemas/booking.schema"
import { LayoutGrid, LayoutList } from "lucide-react"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { useMemo } from "react"
import BookingCard from "../cards/BookingCard"
import { useRenteeBookings } from "../hooks/useRenteeBookings"

const DEFAULT_META = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
}

const filterOptions: FilterOption[] = [
  {
    key: "query",
    label: "Search",
    variant: "search",
    placeholder: "Search bookings…",
  },
  {
    key: "status",
    label: "Status",
    variant: "select",
    options: Constants.public.Enums.booking_status.map((value) => ({
      label: capitalizeFirstLetter(value ?? ""),
      value,
    })),
  },
  {
    key: "event_status",
    label: "Event Status",
    variant: "select",
    options: [
      { label: "Upcoming", value: "upcoming" },
      { label: "Past", value: "past" },
    ],
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
    key: "start_at",
    label: "Started At",
    variant: "date",
  },
]

const RenteeBookingsPage = () => {
  const { state } = useSidebar()
  const isSidebarOpen = state === "expanded"

  // Pagination + view-mode are owned by the page.
  const [page] = useQueryState("page", parseAsInteger.withDefault(1))
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(10))
  const [view, setView] = useQueryState("mode", parseAsString.withDefault("grid"))

  // Filter values are read from the URL — written by RenderToolbar.
  // No setters here; we never want the page to fight the toolbar over URL ownership.
  const [query] = useQueryState("query", parseAsString.withDefault(""))
  const [start_at] = useQueryState("start_at", parseAsString.withDefault(""))
  const [status] = useQueryState("status", parseAsString.withDefault(""))
  const [venue_type] = useQueryState("venue_type", parseAsString.withDefault(""))
  const [event_status] = useQueryState("event_status", parseAsString.withDefault("upcoming"))

  const debouncedQuery = useDebounce(query, 800)

  const filters: BookingFilters = useMemo(
    () =>
      cleanFilters({
        query: debouncedQuery,
        page,
        perPage,
        start_at,
        status,
        venue_type,
        event_status,
      }) as BookingFilters,
    [page, perPage, debouncedQuery, start_at, status, venue_type, event_status]
  )

  const {
    data,
    isLoading: isInitialLoading,
    isRefetching,
    isError,
    error,
  } = useRenteeBookings(filters)

  const bookings = data?.items ?? []
  const meta = data?.meta ?? DEFAULT_META
  const hasBookings = bookings.length > 0

  const handleView = (val: string) => {
    if (!val) return
    setView(val as "list" | "grid")
  }

  return (
    <div className="space-y-3">
      <RenderToolbar filterOptions={filterOptions} className="border-b border-border pb-4">
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground">View Mode {view}</span>
          <ToggleGroup
            type="single"
            value={view}
            defaultValue={view}
            onValueChange={handleView}
            className="border border-border rounded-lg overflow-hidden gap-0 h-8"
            disabled={isInitialLoading || isRefetching}
          >
            <ToggleGroupItem
              value="list"
              className="h-8 w-8 rounded-none border-r border-border data-[state=on]:bg-muted"
            >
              <LayoutList className="size-3.5" />
              <span className="sr-only">List view</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" className="h-8 w-8 rounded-none data-[state=on]:bg-muted">
              <LayoutGrid className="size-3.5" />
              <span className="sr-only">Grid view</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </RenderToolbar>

      <section className="relative min-h-[520px]">
        {isError ? (
          <div className="flex min-h-[520px] items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-destructive">Failed to load Bookings</h3>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : "Could not load Bookings."}
              </p>
            </div>
          </div>
        ) : isInitialLoading ? (
          <BookingsPageSkeleton />
        ) : !hasBookings ? (
          <div className="flex min-h-[520px] items-center justify-center rounded-xl border border-dashed p-6 text-center">
            <div className="space-y-2">
              <h3 className="text-base font-semibold">No Bookings found</h3>
              <p className="text-sm text-muted-foreground">
                {debouncedQuery
                  ? "Try changing your search or clearing the filter."
                  : "You have not added any Bookings yet."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "grid grid-cols-1 gap-4 py-2 transition-opacity md:grid-cols-3 md:gap-6",
                isRefetching ? "opacity-60" : "opacity-100",
                !isSidebarOpen && "md:grid-cols-3",
                view === "list" &&
                  "grid grid-cols-1 gap-4 py-2 transition-opacity md:grid-cols-2 md:gap-6",
                view === "list" &&
                  !isSidebarOpen &&
                  "grid grid-cols-1 gap-4 py-2 transition-opacity md:grid-cols-2 md:gap-6"
              )}
            >
              {bookings?.map((booking: BookingWithRelations) => (
                <BookingCard key={booking.id} booking={booking} listView={view === "list"} />
              ))}
            </div>

            {isRefetching && (
              <div className="pointer-events-none absolute inset-0 flex items-start justify-center rounded-xl bg-background/30 pt-6 backdrop-blur-[1px]">
                <div className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm">
                  Updating Bookings...
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <PaginationWithLinks
        totalCount={meta.total}
        page={meta.page}
        pageSize={meta.pageSize}
        pageSearchParam="page"
        pageSizeSelectOptions={{
          pageSizeSearchParam: "perPage",
          pageSizeOptions: [10, 20, 50, 100],
        }}
      />
    </div>
  )
}

export default RenteeBookingsPage
