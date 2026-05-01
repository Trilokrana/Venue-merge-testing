"use client"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { cleanFilters } from "@/components/data-table/utils"
import { Badge, badgeVariants } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { useOwnerBookings } from "@/components/venue-onwer/hooks/useMyBookings"
import { useDataTable } from "@/hooks/use-data-table"
import { approveBooking, rejectBooking } from "@/lib/bookings/cronofy-actions"
import { BookingWithRelations } from "@/lib/bookings/types"
import { formatDateTime } from "@/lib/format"
import { getSortingStateParser } from "@/lib/parsers"
import { Database } from "@/lib/supabase/database.types"
import { BookingFilters } from "@/schemas/booking.schema"
import { ColumnDef } from "@tanstack/react-table"
import { VariantProps } from "class-variance-authority"
import {
  Ban,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  ClockIcon,
  X,
  XSquare,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { VenueCard } from "../cards/VenueCard"

const getStatusIcon = (status: Database["public"]["Enums"]["booking_status"]) => {
  switch (status) {
    case "pending":
      return <ClockIcon />
    case "confirmed":
      return <Check />
    case "cancelled_by_guest":
      return <X />
    case "cancelled_by_owner":
      return <Ban />
  }
}

const columns: ColumnDef<BookingWithRelations>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label="Select all"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label={`Select ${row.original.id}`}
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },

  {
    id: "venue.name",
    accessorKey: "venue.name",
    header: ({ column }) => <DataTableColumnHeader column={column} label="Name" />,
    cell: ({ getValue }) => (
      <span className="text-xs text-foreground/90 whitespace-break-spaces">
        {getValue<string>()}
      </span>
    ),
    meta: {
      label: "Name",
      variant: "text",
    },
    enableSorting: true,
    enableColumnFilter: true,
    size: 200,
  },
  {
    id: "more_details",
    accessorKey: "more_details",
    header: ({ column }) => <DataTableColumnHeader column={column} label="Details" />,
    cell: ({ row }) =>
      row.getCanExpand() ? (
        <Button
          variant="outline"
          size="icon-sm"
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            row.toggleExpanded()
          }}
          className="flex items-center justify-center rounded w-full text-xs"
          aria-label={row.getIsExpanded() ? "Collapse row" : "Expand row"}
        >
          {`${row.getIsExpanded() ? "Hide" : "Show"} details`}
          {row.getIsExpanded() ? <ChevronUp /> : <ChevronDown />}
        </Button>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      ),
    enableSorting: false,
    size: 140,
    enableColumnFilter: false,
  },
  {
    id: "hourly_rate",
    accessorKey: "hourly_rate",
    header: ({ column }) => <DataTableColumnHeader column={column} label="Hourly Rate" />,
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground">{getValue<string>()}</span>
    ),
    enableSorting: true,
    size: 140,
    enableColumnFilter: true,
  },
  {
    id: "total_hours",
    accessorKey: "total_hours",
    header: ({ column }) => <DataTableColumnHeader column={column} label="Total Hours" />,
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground">{getValue<string>()}</span>
    ),
    enableSorting: true,
    size: 140,
    enableColumnFilter: true,
  },
  {
    id: "total_amount",
    accessorKey: "total_amount",
    header: ({ column }) => <DataTableColumnHeader column={column} label="Total Amount" />,
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground">{getValue<string>()}</span>
    ),
    enableSorting: true,
    size: 140,
    enableColumnFilter: true,
  },
  {
    id: "status",
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} label="Status" />,
    cell: ({ getValue }) => {
      const status = getValue<"string">()
      return (
        <Badge
          variant={status as VariantProps<typeof badgeVariants>["variant"]}
          className="capitalize"
        >
          {getStatusIcon(status as Database["public"]["Enums"]["booking_status"])}
          {getValue<"string">()?.replaceAll("_", " ")}
        </Badge>
      )
    },
    meta: {
      label: "Status",
      variant: "select",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Confirmed", value: "confirmed" },
        { label: "Cancelled by Guest", value: "cancelled_by_guest" },
        { label: "Cancelled by Owner", value: "cancelled_by_owner" },
      ],
    },
    enableSorting: true,
    size: 190,
    enableColumnFilter: true,
  },

  {
    id: "start_at",
    accessorKey: "start_at",
    header: ({ column }) => <DataTableColumnHeader column={column} label="Start At" />,
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground break-all">
        {formatDateTime(getValue<string>())}
      </span>
    ),
    enableSorting: true,
    size: 220,
    meta: {
      label: "Start at",
      variant: "date",
      // disableCalendarFn: { dayOfWeek: [0, 6] } as Matcher,
    },
    enableColumnFilter: true,
  },
  {
    id: "end_at",
    accessorKey: "end_at",
    header: ({ column }) => <DataTableColumnHeader column={column} label="End At" />,
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground break-all">
        {formatDateTime(getValue<string>())}
      </span>
    ),
    enableSorting: true,
    size: 220,
    meta: {
      label: "End at",
      variant: "date",
    },
    enableColumnFilter: true,
  },
  // {
  //   id: "created_at",
  //   accessorKey: "created_at",
  //   header: ({ column }) => <DataTableColumnHeader column={column} label="Created At" />,
  //   cell: ({ getValue }) => (
  //     <span className="text-xs text-muted-foreground break-all">
  //       {formatDateTime(getValue<string>())}
  //     </span>
  //   ),
  //   enableSorting: true,
  //   size: 220,
  //   meta: {
  //     label: "Created at",
  //     variant: "date",
  //   },
  //   enableColumnFilter: true,
  // },
  // {
  //   id: "updated_at",
  //   accessorKey: "updated_at",
  //   header: ({ column }) => <DataTableColumnHeader column={column} label="Updated At" />,
  //   cell: ({ getValue }) => (
  //     <span className="text-xs text-muted-foreground break-all">
  //       {formatDateTime(getValue<string>())}
  //     </span>
  //   ),
  //   enableSorting: true,
  //   size: 220,
  //   enableColumnFilter: true,
  // },
  // {
  //   id: "actions",
  //   accessorKey: "actions",
  //   header: ({ column }) => <DataTableColumnHeader column={column} label="Actions" />,
  //   cell: ({ row }) => (
  //     <div className="flex items-center justify-center gap-2">
  //       <Button variant="outline" size="icon-sm">
  //         <Pencil />
  //       </Button>
  //     </div>
  //   ),
  //   enableSorting: false,
  //   size: 90,
  //   enableColumnFilter: false,
  // },
]

const OwnerBookingsPage = () => {
  const [page] = useQueryState("page", parseAsInteger.withDefault(1))
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(10))
  const [query] = useQueryState("venue.name", parseAsString.withDefault(""))
  const [status] = useQueryState("status", parseAsArrayOf(parseAsString).withDefault([]))
  const [sort] = useQueryState(
    "sort",
    getSortingStateParser(columns.map((c) => c.id as string) as string[]).withDefault([])
  )
  const [created_at] = useQueryState("created_at", parseAsString.withDefault(""))
  const [start_at] = useQueryState("start_at", parseAsString.withDefault(""))
  const [end_at] = useQueryState("end_at", parseAsString.withDefault(""))

  const filters = useMemo(() => {
    return cleanFilters<BookingFilters>({
      query: query ?? null,
      page,
      perPage,
      status: status[0] ?? undefined,
      sort_column: sort?.[0]?.id ?? undefined,
      sort_order:
        sort?.[0]?.desc === true
          ? "desc"
          : sort?.[0]?.desc === false
            ? "asc"
            : (undefined as "asc" | "desc" | undefined),
      created_at,
      start_at,
      end_at,
    }) as unknown as BookingFilters
  }, [page, perPage, status, sort, created_at, query, start_at, end_at])

  const { data, isError, isLoading } = useOwnerBookings(filters)
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const handleStatusUpdate = async (id: string, action: "approve" | "reject") => {
    setIsUpdating(id)
    try {
      const res = action === "approve" ? await approveBooking(id) : await rejectBooking(id)
      if (res.success) {
        toast.success(`Booking ${action}d successfully.`)
        router.refresh()
        // Wait for page refresh
        setTimeout(() => window.location.reload(), 500)
      } else {
        toast.error(`Failed to ${action} booking.`, { description: res.error })
      }
    } finally {
      setIsUpdating(null)
    }
  }

  console.log("🚀 ~ OwnerBookingsPage ~ data?.items :", data?.items)
  const { table } = useDataTable({
    data: data?.items ?? [],
    columns: columns,
    pageCount: data?.meta?.totalPages ?? 0,
    getRowId: (row) => row.id,
    enableRowExpansion: true,
    getRowCanExpand: (row) => {
      const currentRow = row.original as BookingWithRelations
      const list = Array.isArray(currentRow) ? currentRow : currentRow ? [currentRow] : []
      return list.length > 0
    },
    initialState: {
      columnPinning: {
        left: ["select", "venue.name"],
        right: ["actions"],
      },
    },
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Bookings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your bookings and view the details of each booking.
        </p>
      </div>

      <DataTable
        table={table}
        isLoading={isLoading}
        noDataText="No Bookings Found."
        renderExpandedRow={(row) => {
          const currentRow = row.original
          const isApproved = currentRow.status === "awaiting_payment"
          return (
            <div
              className="px-4 py-3"
              style={{ boxShadow: "inset 0px 6px 10px -6px rgba(0, 0, 0, 0.31)" }}
            >
              <div className="px-4 py-3 flex flex-col lg:flex-row gap-4 items-start">
                {/* Left Column: Venue + Actions */}
                <div className="flex flex-col gap-3 w-full lg:w-[45%]">
                  <VenueCard className="w-full" venue={currentRow.venue} variant="list" />

                  {currentRow.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(currentRow.id, "approve")}
                        disabled={isUpdating === currentRow.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckSquare className="mr-2 size-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStatusUpdate(currentRow.id, "reject")}
                        disabled={isUpdating === currentRow.id}
                        className="flex-1"
                      >
                        <XSquare className="mr-2 size-4" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {currentRow.status === "awaiting_payment" && (
                    <div className="flex items-center justify-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm font-medium text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-950/30 dark:text-yellow-500">
                      <ClockIcon className="size-4" />
                      Awaiting Payment from Guest
                    </div>
                  )}
                </div>

                {/* Right Column: Guest Information */}
                <Card className="w-full lg:w-[35%] flex flex-col gap-0 max-h-46">
                  <CardHeader className="pb-4 shrink-0">
                    <CardTitle className="text-base font-semibold">Guest Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 overflow-y-auto">
                    {/* Guest Profile */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                        {currentRow?.rentee?.display_name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-medium text-foreground truncate">
                          {currentRow?.rentee?.display_name || "Unknown Guest"}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-xs font-normal capitalize">
                            {currentRow?.rentee?.account_type}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Booking Notes */}
                    {currentRow?.notes &&
                       currentRow.notes.trim() && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Booking Notes
                            </h4>
                            <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                               {currentRow.notes.trim()}
                            </p>
                          </div>
                        </>
                      )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        }}
      >
        <DataTableToolbar table={table}></DataTableToolbar>
      </DataTable>
    </div>
  )
}

export default OwnerBookingsPage
