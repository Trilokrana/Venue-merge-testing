"use client"

import { RenderToolbar, type FilterOption } from "@/components/common/toolbar/RenderToolbar"
import { cleanFilters } from "@/components/data-table/utils"
import { PaginationWithLinks } from "@/components/ui/pagination-with-links"
import { useSidebar } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { VenueCard } from "@/components/venue-onwer/cards/VenueCard"
import { useDeleteMyVenue, useMyVenues } from "@/components/venue-onwer/hooks/useMyVenues"
import { DeleteVenueModal } from "@/components/venue-onwer/modal/DeleteVenueModal"
import { EditVenueModal } from "@/components/venue-onwer/modal/EditVenueModal"
import { ViewVenueModal } from "@/components/venue-onwer/modal/ViewVenueDetails"
import { useDebounce } from "@/hooks/use-debounce"
import { useModalControlQuery } from "@/hooks/use-modal-control-query"
import { cn } from "@/lib/utils"
import { isOwnerCalendarConnected } from "@/lib/venues/actions"
import { VenueWithRelations } from "@/lib/venues/types"
import { VenueFilters } from "@/schemas/venue.schema"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { LayoutGrid, LayoutList } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

const DEFAULT_META = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
}

const SKELETON_COUNT = 9

function VenueCardSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border bg-background p-3">
      <Skeleton className="aspect-16/10 w-full rounded-lg" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="h-9 flex-1 rounded-md" />
        <Skeleton className="h-9 flex-1 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
    </div>
  )
}

const filterOptions: FilterOption[] = [
  {
    key: "query",
    label: "Search",
    variant: "search",
    placeholder: "Search bookings…",
  },
]

const VenuesListingPage = () => {
  const { state } = useSidebar()
  const isSidebarOpen = state === "expanded"
  // Pagination + view-mode are owned by the page.
  const [page] = useQueryState("page", parseAsInteger.withDefault(1))
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(10))
  const [view, setView] = useQueryState("mode", parseAsString.withDefault("grid"))

  // Filter values are read from the URL — written by RenderToolbar.
  // No setters here; we never want the page to fight the toolbar over URL ownership.
  const [query] = useQueryState("query", parseAsString.withDefault(""))

  const debouncedQuery = useDebounce(query, 800)

  const viewDialog = useModalControlQuery("view-venue-details")
  const editDialog = useModalControlQuery("edit-venue-details")
  const deleteDialog = useModalControlQuery("delete-venue-details")

  const [selectedVenue, setSelectedVenue] = useState<VenueWithRelations | null>(null)

  const filters: VenueFilters = useMemo(
    () =>
      cleanFilters({
        query: debouncedQuery,
        page,
        perPage,
      }) as VenueFilters,
    [page, perPage, debouncedQuery]
  )

  const { data, isLoading: isInitialLoading, isRefetching, isError, error } = useMyVenues(filters)
  console.log("🚀 ~ VenuesListingPage ~ isError:", isError)
  console.log("🚀 ~ VenuesListingPage ~ data:", data)

  const venues = data?.items ?? []
  const meta = data?.meta ?? DEFAULT_META
  const hasVenues = venues.length > 0

  const { mutateAsync: deleteVenue, isPending: isPendingDeleteVenue } = useDeleteMyVenue()

  useLayoutEffect(() => {
    viewDialog.set(false)
    editDialog.set(false)
    deleteDialog.set(false)
  }, [])

  const openDelete = (venue: VenueWithRelations) => {
    setSelectedVenue(venue)
    deleteDialog.set(true)
  }

  const openEdit = (venue: VenueWithRelations) => {
    setSelectedVenue(venue)
    editDialog.set(true)
  }

  const openView = (venue: VenueWithRelations) => {
    setSelectedVenue(venue)
    viewDialog.set(true)
  }

  const { data: calendarConnected } = useQuery({
    queryKey: ["owner-calendar-connected"],
    queryFn: () => isOwnerCalendarConnected(),
  })

  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const handledOAuthRef = useRef("")

  const handleView = (val: string) => {
    if (!val) return
    setView(val as "list" | "grid")
  }

  useEffect(() => {
    const success = searchParams.get("success")
    const err = searchParams.get("error")
    const hint = searchParams.get("hint")
    if (success !== "1" && !err) return

    const dedupeKey = `${success ?? ""}|${err ?? ""}|${hint ?? ""}`
    if (handledOAuthRef.current === dedupeKey) return
    handledOAuthRef.current = dedupeKey

    if (success === "1") {
      toast.success("Calendar connected successfully", {
        description: "Your venues are linked for availability. Credentials are saved securely.",
      })
      void queryClient.invalidateQueries({ queryKey: ["owner-calendar-connected"] })
      void queryClient.invalidateQueries({ queryKey: ["venues"] })
    } else if (err) {
      let extra = ""
      if (hint === "add_service_role") {
        extra =
          " Add SUPABASE_SERVICE_ROLE_KEY to .env.local (server) so tokens can be saved, then restart dev."
      } else if (hint === "run_sql_migration") {
        extra = " Ensure the cronofy_credentials table exists in Supabase."
      }
      const detail =
        err === "save_failed"
          ? "Could not write Cronofy tokens to the database."
          : err.replace(/_/g, " ")
      toast.error("Calendar connection failed", {
        description: `${detail}${extra}`,
      })
    }

    router.replace("/venues", { scroll: false })
  }, [searchParams, router, queryClient])

  const ownerLinked = calendarConnected === true

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
              <h3 className="text-base font-semibold text-destructive">Failed to load venues</h3>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : "Could not load venues."}
              </p>
            </div>
          </div>
        ) : isInitialLoading ? (
          <div
            className={cn(
              "grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-6",
              !isSidebarOpen && "md:grid-cols-4"
            )}
          >
            {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
              <VenueCardSkeleton key={index} />
            ))}
          </div>
        ) : !hasVenues ? (
          <div className="flex min-h-[520px] items-center justify-center rounded-xl border border-dashed p-6 text-center">
            <div className="space-y-2">
              <h3 className="text-base font-semibold">No venues found</h3>
              <p className="text-sm text-muted-foreground">
                {debouncedQuery
                  ? "Try changing your search or clearing the filter."
                  : "You have not added any venues yet."}
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
              {venues.map((venue) => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  onDelete={openDelete}
                  onEdit={openEdit}
                  onView={openView}
                  variant={view === "list" ? "list" : ("default" as "list" | "default")}
                />
              ))}
            </div>

            {isRefetching && (
              <div className="pointer-events-none absolute inset-0 flex items-start justify-center rounded-xl bg-background/30 pt-6 backdrop-blur-[1px]">
                <div className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm">
                  Updating venues...
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

      <ViewVenueModal venue={selectedVenue as VenueWithRelations} dialogControl={viewDialog} />
      <EditVenueModal venue={selectedVenue as VenueWithRelations} dialogControl={editDialog} />
      <DeleteVenueModal
        isLoading={isPendingDeleteVenue}
        venue={selectedVenue as VenueWithRelations}
        dialogControl={deleteDialog}
        onConfirm={async (id) => {
          const result = await deleteVenue(id as string)

          if (result) {
            deleteDialog.set(false)
            toast.success("Venue deleted successfully")
          } else {
            toast.error("Failed to delete venue")
          }
        }}
      />
    </div>
  )
}

export default VenuesListingPage
