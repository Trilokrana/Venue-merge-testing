"use client"
import { ArrowRight, CalendarDays, Check, Clock, DollarSign, X } from "lucide-react"
import Link from "next/link"

import { cleanFilters } from "@/components/data-table/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import IconWrapper from "@/components/ui/icon-wrapper"
import { Skeleton } from "@/components/ui/skeleton"
import { useUser } from "@/hooks/use-user"
import { approveBooking, rejectBooking } from "@/lib/bookings/cronofy-actions"
import { BookingWithRelations } from "@/lib/bookings/types"
import { capitalizeFirstLetter, formatCurrency } from "@/lib/format"
import { BookingFilters } from "@/schemas/booking.schema"
import { useConfirm } from "@omit/react-confirm-dialog"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { useOwnerBookings } from "../hooks/useMyBookings"
import { useOwnerKPIs } from "../hooks/useMyDashboard"

const kpisData = {
  upcoming_bookings: {
    label: "Upcoming bookings",
    sublabel: "Next in 3 days",
    icon: CalendarDays,
  },
  pending_requests: {
    label: "Pending requests",
    sublabel: "Awaiting host approval",
    icon: Clock,
  },
  total_earnings: {
    label: "Total earnings",
    sublabel: "This year",
    icon: DollarSign,
  },
}

function greetingFor(date: Date): string {
  const h = date.getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

function formatTodayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

export default function RenteeDashboardPage() {
  const confirmApprove = useConfirm()
  const confirmReject = useConfirm()
  const { data: user } = useUser()
  const renteeName =
    user?.user?.user_metadata?.full_name ?? user?.user?.user_metadata?.first_name ?? "Guest"

  const now = new Date()
  const {
    data: renteeKpis = { upcoming_bookings: 0, pending_requests: 0, total_earnings: 0 },
    isLoading: kpisLoading,
    isPending: kpisPending,
  } = useOwnerKPIs()
  const isKpisLoading = kpisLoading || kpisPending

  const upcomingBookingsFilters = cleanFilters({
    status: "confirmed",
    event_status: "upcoming",
    page: 1,
    perPage: 5,
  })
  const {
    data: upcomingBookingsData,
    isLoading: upcomingBookingsLoading,
    isPending: upcomingBookingsPending,
  } = useOwnerBookings(upcomingBookingsFilters as BookingFilters)
  const isUpcomingBookingsLoading = upcomingBookingsLoading || upcomingBookingsPending

  const pendingBookingsFilters = cleanFilters({
    status: "pending",
    event_status: "upcoming",
    page: 1,
    perPage: 5,
  })
  const {
    data: pendingBookingsData,
    isLoading: pendingBookingsLoading,
    isPending: pendingBookingsPending,
  } = useOwnerBookings(pendingBookingsFilters as BookingFilters)
  const isPendingBookingsLoading = pendingBookingsLoading || pendingBookingsPending

  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const queryClient = useQueryClient()

  const handleStatusUpdate = async (id: string, action: "approve" | "reject") => {
    setIsUpdating(true)
    try {
      const res =
        action === "approve"
          ? await approveBooking(id)
          : action === "reject"
            ? await rejectBooking(id)
            : null
    } finally {
      setIsUpdating(false)
      queryClient.invalidateQueries({
        queryKey: [
          "owner-bookings",
          { page: 1, perPage: 5, status: "pending", event_status: "upcoming" },
        ],
      })
      queryClient.invalidateQueries({ queryKey: ["owner-kpis"] })
      setTimeout(() => {
        router.refresh()
      }, 500)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{formatTodayLabel(now)}</p>
          <h1 className="text-2xl font-bold">
            {greetingFor(now)}, {renteeName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Your bookings and saved venues, all in one place.
          </p>
        </div>

        {/* <div className="flex flex-wrap gap-2">
          <Button size="sm" asChild>
            <Link href="/listings">
              <Search className="mr-2 size-4" aria-hidden />
              Find a venue
            </Link>
          </Button>
        </div> */}
      </header>

      {/* KPI strip */}
      <section
        aria-label="Your activity"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {Object.keys(kpisData).map((key) => {
          const k = kpisData[key as keyof typeof kpisData]
          const value = renteeKpis?.[key as keyof typeof renteeKpis] ?? 0
          return (
            <OwnerKpi
              key={key}
              isLoading={isKpisLoading}
              label={k.label}
              sublabel={k.sublabel}
              icon={k.icon}
              value={value.toString()}
            />
          )
        })}
      </section>

      {/* Hero: next booking + Pending requests */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card size="sm" className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold flex flex-col sm:flex-row items-center gap-2">
                <IconWrapper variant="primary">
                  <CalendarDays className="size-4" />
                </IconWrapper>
                <div>
                  <span>Upcoming bookings</span>
                  <p className="text-xs text-muted-foreground font-medium">
                    {upcomingBookingsData?.meta.total} bookings.
                  </p>
                </div>
              </CardTitle>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/bookings?event_status=upcoming">
                View all
                <ArrowRight className="ml-1.5 size-4" aria-hidden />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-xs">
                <thead className="bg-muted/80 pb-2 border-b">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Venue</th>
                    <th className="px-6 py-3 font-medium">Time</th>
                    <th className="px-6 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {isUpcomingBookingsLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4">
                          <Skeleton className="h-6 w-28" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-6 w-full" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-6 w-20" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Skeleton className="ml-auto h-6 w-20" />
                        </td>
                      </tr>
                    ))
                  ) : upcomingBookingsData?.items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-1">
                        <p className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground w-full">
                          No upcoming bookings.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    upcomingBookingsData?.items.map((b) => (
                      <tr key={b?.id} className="transition-colors hover:bg-muted/30">
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {format(new Date(b.start_at), "EEE, MMM d, yyyy")}
                        </td>

                        <td className="px-6 py-4 font-medium text-foreground truncate">
                          {b.venue.name}
                        </td>

                        <td className="px-6 py-4 text-muted-foreground">
                          {format(new Date(b.start_at), "hh:mm a")}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <Badge variant={b?.status} className="capitalize">
                            {b?.status?.replaceAll("_", " ")}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Pending requests</CardTitle>
            <p className="text-xs text-muted-foreground">Waiting on host approval</p>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
            {isPendingBookingsLoading ? (
              Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl p-4 items-center space-y-2 border border-dashed"
                >
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-10" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-6 w-10" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              ))
            ) : pendingBookingsData?.items.length === 0 ? (
              <p className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground w-full">
                No pending requests.
              </p>
            ) : (
              pendingBookingsData?.items.map((b: BookingWithRelations) => (
                <div key={b.id} className="rounded-2xl bg-card border border-dashed p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{b.venue.name}</p>
                    <Badge variant={b.status} className="shrink-0 text-[10px]">
                      {capitalizeFirstLetter(b.status?.replaceAll("_", " "))}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(new Date(b.start_at), "EEE, MMM d, yyyy")}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">
                      Total : {formatCurrency(b.total_amount ?? 0)}
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        size="xs"
                        onClick={async (event) => {
                          event.preventDefault()
                          event.stopPropagation()

                          const result = await confirmApprove({
                            title: "Approve Booking",
                            description: "Are you sure you want to approve this booking?",
                          })

                          if (!result) return

                          toast.promise(handleStatusUpdate(b.id, "approve"), {
                            loading: (
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">Approving Booking...</span>
                                <span className="text-xs text-muted-foreground">
                                  {b.venue.name} • ₹{b.total_amount}
                                </span>
                              </div>
                            ),

                            success: (
                              <div className="flex items-start gap-3">
                                <div className="flex flex-col">
                                  <span className="font-medium">Booking Approved 🎉</span>
                                  <span className="text-xs text-muted-foreground">
                                    {b.venue.name} • ₹{b.total_amount}
                                  </span>
                                </div>
                              </div>
                            ),

                            error: (
                              <div className="flex flex-col">
                                <span className="font-medium text-red-500">Approval Failed ❌</span>
                                <span className="text-xs text-muted-foreground">
                                  Try again in a moment
                                </span>
                              </div>
                            ),
                          })
                        }}
                        disabled={isUpdating}
                        className="flex-1 gap-2 bg-green-500 hover:bg-green-700"
                      >
                        <Check className="size-4" />
                        Approve
                      </Button>
                      <Button
                        size="xs"
                        variant="destructive"
                        onClick={async (event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          const result = await confirmReject({
                            title: (
                              <div className="flex items-center gap-2">
                                <IconWrapper
                                  variant="secondary"
                                  className="bg-destructive/10 text-destructive"
                                >
                                  <X className="size-4" />
                                </IconWrapper>
                                Reject Booking
                              </div>
                            ),
                            description: "Are you sure you want to reject this booking?",
                            confirmButton: {
                              variant: "destructive",
                              size: "lg",
                              className: "px-4",
                            },
                            confirmText: "Reject",
                          })

                          if (!result) return

                          toast.promise(async () => await handleStatusUpdate(b.id, "reject"), {
                            loading: "Rejecting booking...",
                            success: "Booking rejected successfully ✅",
                            error: "Failed to reject booking ❌",
                          })
                        }}
                        disabled={isUpdating}
                        className="flex-1 gap-2"
                      >
                        <X className="size-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function OwnerKpi({
  label,
  value,
  sublabel,
  icon: Icon,
  isLoading = false,
}: {
  label: string
  value: string
  sublabel: string
  icon: typeof CalendarDays
  isLoading: boolean
}) {
  return (
    <Card size="sm">
      <CardContent>
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {/* <div
            className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary"
            aria-hidden
          >
            <Icon className="size-4" />
          </div> */}
          <IconWrapper variant="primary">
            <Icon className="size-4" />
          </IconWrapper>
        </div>
        {isLoading ? (
          <Skeleton className="h-6 w-24" />
        ) : (
          <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>
      </CardContent>
    </Card>
  )
}
