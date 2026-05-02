import { createServiceSupabaseClient } from "@/lib/supabase/service-client"
import { ActionResult } from "@/lib/supabase/utils"
import { OwnerKPIs, RenteeKPIs } from "../types"
import { DateUtils, getDayRange } from "@/lib/format"
import { format } from "date-fns"

export async function getRenteeKPIs(renteeId: string): Promise<ActionResult<RenteeKPIs>> {
  const supabase = createServiceSupabaseClient()
  const now = new Date().toISOString()
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString()

  // 1) Upcoming confirmed bookings as a rentee
  const { count: upcomingCount, error: upcomingErr } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("rentee_id", renteeId)
    .eq("status", "confirmed")
    .gte("start_at", now)

  if (upcomingErr) {
    console.error("Error fetching upcoming bookings:", upcomingErr)
    throw upcomingErr
  }

  // 2) Pending requests as a rentee
  const { count: pendingCount, error: pendingErr } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("rentee_id", renteeId)
    .eq("status", "pending")

  if (pendingErr) {
    console.error("Error fetching pending requests:", pendingErr)
    throw pendingErr
  }

  // 3) Total spent this year — only confirmed bookings
  const { data: spentRows, error: spentErr } = await supabase
    .from("bookings")
    .select("total_amount")
    .eq("rentee_id", renteeId)
    .eq("status", "confirmed")
    .gte("created_at", yearStart)
    .lt("created_at", now)

  if (spentErr) {
    console.error("Error fetching total spent:", spentErr)
    throw spentErr
  }

  const totalSpent = spentRows?.reduce((acc, row) => acc + (row.total_amount ?? 0), 0) ?? 0

  return {
    success: true,
    data: {
      upcoming_bookings: upcomingCount ?? 0,
      pending_requests: pendingCount ?? 0,
      total_spent: totalSpent,
    } as unknown as RenteeKPIs,
    statusCode: 200,
  }
}

export async function getOwnerKPIs(ownerId: string): Promise<ActionResult<OwnerKPIs>> {

  const supabase = createServiceSupabaseClient()
  const { start, end } = getDayRange(new Date().toISOString())
  const now = start
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString()
  const { start: monthStart, end: monthEnd } = DateUtils.getMonthRange(new Date())
  console.log("🚀 ~ getOwnerKPIs ~ monthEnd:", monthEnd)
  console.log("🚀 ~ getOwnerKPIs ~ monthStart:", monthStart)

  // 1) Upcoming confirmed bookings as a rentee
  const { count: upcomingCount, error: upcomingErr } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .eq("status", "confirmed")
    .gte("start_at", now)

  if (upcomingErr) {
    console.error("Error fetching upcoming bookings:", upcomingErr)
    throw upcomingErr
  }

  // 2) Pending requests as a rentee
  const { count: pendingCount, error: pendingErr } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .eq("status", "pending")

  if (pendingErr) {
    console.error("Error fetching pending requests:", pendingErr)
    throw pendingErr
  }

  // 3) Total spent this year — only confirmed bookings
  const { data: spentRows, error: spentErr } = await supabase
    .from("bookings")
    .select("total_amount")
    .eq("owner_id", ownerId)
    .eq("status", "confirmed")
    .gte("created_at", yearStart)
    .lt("created_at", start)

  if (spentErr) {
    console.error("Error fetching total spent:", spentErr)
    throw spentErr
  }

  const totalEarnings = spentRows?.reduce((acc, row) => acc + (row.total_amount ?? 0), 0) ?? 0

  // 4) Total venues
  const { count: venuesCount, error: venuesErr } = await supabase
    .from("venues")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId)

  if (venuesErr) {
    console.error("Error fetching total venues:", venuesErr)
    throw venuesErr
  }

  const totalVenues = venuesCount ?? 0

  // 5) Bookings this month
  const { data: bookingsThisMonthData, count: bookingsThisMonthCount, error: bookingsThisMonthErr } = await supabase
    .from("bookings")
    .select(`
        id,
        start_at,
        end_at,
        status,
        created_at,
        total_amount,
        venue:venues!bookings_venue_id_fkey!inner (
          name,
          venue_type
        ),
        rentee:users!bookings_rentee_id_fkey!inner (
          id,
          display_name,
          account_type
        ),
        owner:users!bookings_owner_id_fkey!inner (
          id,
          display_name,
          account_type
        )
        `, { count: "exact" })
    .eq("owner_id", ownerId)
    .gte("start_at", monthStart)
    .lt("start_at", monthEnd)

  if (bookingsThisMonthErr) {
    console.error("Error fetching bookings this month:", bookingsThisMonthErr)
    throw bookingsThisMonthErr
  }

  const totalBookingsThisMonth = bookingsThisMonthCount ?? 0


  return {
    success: true,
    data: {
      upcoming_bookings: upcomingCount ?? 0,
      pending_requests: pendingCount ?? 0,
      total_earnings: totalEarnings,
      total_venues: totalVenues,
      bookings_this_month: {
        count: totalBookingsThisMonth,
        data: bookingsThisMonthData,
      },
    } as unknown as OwnerKPIs,
    statusCode: 200,
  }
}
