import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, normalizePagination } from "@/lib/pagination"
import { createServiceSupabaseClient } from "@/lib/supabase/service-client"
import { BookingFilters } from "@/schemas/booking.schema"
import { getDayRange } from "@/lib/format"

export async function getBookingsByOwnerId(ownerId: string, filters?: BookingFilters) {
  const supabase = createServiceSupabaseClient()

  const { page, pageSize, from, to } = normalizePagination({
    page: filters?.page || DEFAULT_PAGE,
    pageSize: filters?.perPage || DEFAULT_PAGE_SIZE,
  })

  let query = supabase
    .from("bookings")
    .select(
      `
        *,
        venue:venues!bookings_venue_id_fkey!inner (
          *,
          addresses (*),
          images (*)
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
        `,
      { count: "exact" }
    )
    .eq("owner_id", ownerId)

  // ---------- Filters ----------
  if (filters?.query?.trim()) {
    const search = filters.query.trim().replace(/\s+/g, " ")
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`, {
      foreignTable: "venues",
    })
  }

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  // CREATED_AT
  if (filters?.created_at) {
    const { start, end } = getDayRange(filters.created_at)
    query = query.gte("created_at", start).lt("created_at", end)
  }

  // START_AT
  if (filters?.start_at) {
    const { start, end } = getDayRange(filters.start_at)
    query = query.gte("start_at", start).lt("start_at", end)
  }

  // END_AT (FIXED ISSUE HERE)
  if (filters?.end_at) {
    const { start, end } = getDayRange(filters.end_at)
    query = query.gte("end_at", start).lt("end_at", end)
  }

  // ---------- Sorting ----------

  if (filters?.sort_column && filters?.sort_order) {
    if (filters?.sort_column.includes(".")) {
      const [table, column] = filters.sort_column.split(".")
      query = query.order(column, {
        referencedTable: table,
        ascending: filters.sort_order === "asc",
      })
    } else {
      query = query.order(filters.sort_column, { ascending: filters.sort_order === "asc" })
    }
  }

  // ---------- Ordering ----------

  query = query
    .order("created_at", { ascending: false })
    // .order("sort_order", { referencedTable: "images", ascending: true })
    .range(from, to)

  const { data, error, count } = await query

  if (error) {
    return {
      success: false,
      error: error.message,
      statusCode: 500,
    }
  }

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    items: data ?? [],
    meta: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  }
}

export async function getBookingsByRenteeId(renteeId: string, filters?: BookingFilters) {
  const supabase = createServiceSupabaseClient()

  const { page, pageSize, from, to } = normalizePagination({
    page: filters?.page || DEFAULT_PAGE,
    pageSize: filters?.perPage || DEFAULT_PAGE_SIZE,
  })

  let query = supabase
    .from("bookings")
    .select(
      `
        *,
        venue:venues!bookings_venue_id_fkey!inner (
          *,
          addresses (*),
          images (*)
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
        `,
      { count: "exact" }
    )
    .eq("rentee_id", renteeId)

  const now = new Date().toISOString()

  // ---------- Filters ----------

  // 🔍 Search (venue name + description)
  if (filters?.query?.trim()) {
    const search = filters.query.trim().replace(/\s+/g, " ")
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`, {
      foreignTable: "venues",
    })
  }

  // Status
  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  // Start Date (exact day filter)
  if (filters?.start_at) {
    const { start, end } = getDayRange(filters.start_at)
    query = query.gte("start_at", start).lt("start_at", end)
  }

  if (filters?.venue_type) {
    query = query.eq("venue.venue_type", filters.venue_type)
  }

  // Event Status (clean + predictable)
  if (filters?.event_status) {
    const {start: startNow, end: endNow}   = getDayRange(now)
    if (filters.event_status === "upcoming") {
      query = query.gte("start_at", startNow)
    } else if (filters.event_status === "past") {
      query = query.lte("start_at", endNow)
    }
  }
  // ---------- Ordering ----------
  query = query
    .order("start_at", { ascending: true })
    // .order("sort_order", { referencedTable: "images", ascending: true })
    .range(from, to)

  const { data, error, count } = await query

  if (error) {
    return {
      success: false,
      error: error.message,
      statusCode: 500,
    }
  }

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    items: data ?? [],
    meta: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  }
}

export async function checkVenueOwnership(venueId: string, userId: string) {
  const supabase = createServiceSupabaseClient()

  const { data, error } = await supabase
    .from("venues")
    .select("owner_id")
    .eq("id", venueId)
    .single()

  if (error) throw error
  return data.owner_id === userId
}
