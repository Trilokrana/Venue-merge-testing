import { createServiceSupabaseClient } from "@/lib/supabase/service-client"
import { ListingsFilters } from "@/schemas/listings.schema"

interface GetListingsOptions {
  filters?: ListingsFilters
  page?: number
  pageSize?: number
}

/** Narrow fluent API used by getFilteredListings (avoids `any` on generic constraints). */
type VenueListingsFilterChain<Q> = {
  or: (filters: string) => Q
  eq: (column: string, value: string | number | boolean) => Q
  overlaps: (column: string, values: string[]) => Q
  ilike: (column: string, pattern: string) => Q
  gte: (column: string, value: number) => Q
  lte: (column: string, value: number) => Q
  contains: (column: string, values: string[]) => Q
  in: (column: string, values: readonly string[]) => Q
}

export async function getFilteredListings(options?: GetListingsOptions) {
  const { filters, page = 1, pageSize = 24 } = options || {}

  const supabase = createServiceSupabaseClient()

  // Helper to apply identical filters to both queries
  const applyFilters = <T extends VenueListingsFilterChain<T>>(q: T): T => {
    if (!filters) return q

    let qq = q

    // --- Text search ---
    if (filters.query) {
      // Search name OR description for richer results (matches your UI hint)
      qq = qq.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`)
    }

    // --- Venue type ---
    if (filters.venue_type) {
      qq = qq.eq("venue_type", filters.venue_type)
    }

    // --- Event types (array overlap) ---
    if (filters.event_types && filters.event_types.length > 0) {
      qq = qq.overlaps("event_types", filters.event_types)
    }

    // --- City (from place label if provided, else direct city filter) ---
    if (filters.city) {
      qq = qq.ilike("addresses.city", `%${filters.city}%`)
    }

    // --- Capacity range ---
    if (filters.min_capacity) {
      qq = qq.gte("capacity", filters.min_capacity)
    }
    if (filters.max_capacity) {
      qq = qq.lte("capacity", filters.max_capacity)
    }

    // --- Hourly rate ---
    if (filters.max_hourly_rate) {
      qq = qq.lte("hourly_rate", filters.max_hourly_rate)
    }

    // --- Min hours range ("min,max" string or single number) ---
    if (filters.min_hours) {
      const parts = String(filters.min_hours)
        .split(",")
        .map((v) => Number(v.trim()))
        .filter((v) => Number.isFinite(v))

      if (parts.length === 1) {
        // Single value → treat as minimum
        qq = qq.gte("min_hours", parts[0])
      }

      if (parts.length === 2) {
        const [rangeMin, rangeMax] = parts

        if (Number.isFinite(rangeMin)) {
          qq = qq.gte("min_hours", rangeMin)
        }

        if (Number.isFinite(rangeMax)) {
          qq = qq.lte("min_hours", rangeMax)
        }
      }
    }

    // --- Amenities (venue must have ALL selected) ---
    if (filters.amenities && filters.amenities.length > 0) {
      qq = qq.contains("amenities", filters.amenities)
    }

    // --- Indoor / Outdoor (include "both" when a specific side is picked) ---
    if (filters.indoor_outdoor) {
      if (filters.indoor_outdoor === "both") {
        qq = qq.eq("indoor_outdoor", "both")
      } else {
        qq = qq.in("indoor_outdoor", [filters.indoor_outdoor, "both"])
      }
    }

    // --- Instant booking ---
    if (filters.instabook) {
      qq = qq.eq("instabook", true)
    }

    return qq
  }

  // Base queries
  let countQuery = supabase
    .from("venues")
    .select("id, addresses!inner(city)", { count: "exact", head: true })
    .eq("is_active", true)

  let query = supabase
    .from("venues")
    .select(
      `
      *,
      addresses!inner (
        street,
        address_line_2,
        city,
        state,
        country,
        lat,
        lng
      ),
      images (
        id,
        storage_path,
        url,
        is_featured,
        sort_order
      )
    `
    )
    .eq("is_active", true)
    .eq("calendar_sync", "connected")
    .order("created_at", { ascending: false })

  query = applyFilters(query)
  countQuery = applyFilters(countQuery)

  // --- Availability filter (date + time) ---
  // If the user searched for a specific date/time slot, exclude venues
  // that already have a confirmed/pending booking overlapping that window.
  let excludedVenueIds: string[] = []
  if (filters?.date && filters?.startTime && filters?.endTime) {
    const slotStart = new Date(`${filters.date}T${filters.startTime}:00`).toISOString()
    const slotEnd = new Date(`${filters.date}T${filters.endTime}:00`).toISOString()

    const { data: conflictingBookings, error: bookingError } = await supabase
      .from("bookings")
      .select("venue_id")
      .in("status", ["confirmed", "pending"])
      .lt("start_at", slotEnd)
      .gt("end_at", slotStart)

    if (bookingError) throw bookingError

    excludedVenueIds = Array.from(
      new Set((conflictingBookings ?? []).map((b) => b.venue_id).filter(Boolean))
    ) as string[]

    if (excludedVenueIds.length > 0) {
      query = query.not("id", "in", `(${excludedVenueIds.join(",")})`)
      countQuery = countQuery.not("id", "in", `(${excludedVenueIds.join(",")})`)
    }
  }

  // Get total count
  const { count, error: countError } = await countQuery
  if (countError) throw countError

  const total = count || 0
  const totalPages = Math.ceil(total / pageSize)

  // Apply pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error } = await query
  if (error) throw error

  return {
    items: data || [],
    total,
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

export async function getSingleListingBySlug(slug: string) {
  const supabase = createServiceSupabaseClient()

  const query = supabase
    .from("venues")
    .select(
      `
        *,
        addresses (
          street,
          address_line_2,
          city,
          state,
          country,
          zip,
          lat,
          lng
        ),
        images (
          id,
          storage_path,
          url,
          width,
          height,
          size,
          is_featured,
          sort_order
        ),
        ratings (
          rating,
          review,
          user_id,
          created_at
        )
      `
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .eq("calendar_sync", "connected")
    .order("sort_order", { referencedTable: "images", ascending: true })
    .maybeSingle()

  const { data, error } = await query

  if (error) throw error
  return data
}
