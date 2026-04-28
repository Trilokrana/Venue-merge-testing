import "server-only"

import { createServiceSupabaseClient } from "@/lib/supabase/service-client"
import type { VenueWithRelations } from "@/lib/venues/types"

const venueSelect = `
  id,
  name,
  phone,
  capacity,
  rating,
  venue_type,
  owner_id,
  indoor_outdoor,
  square_footage,
  description,
  amenities,
  parking,
  accessibility,
  audio_system,
  hours_of_operation,
  cancellation_policy,
  social_media_links,
  is_active,
  created_at,
  slug,
  event_types,
  rules,
  instabook,
  calendar_sync,
  hourly_rate,
  min_hours,
  owner:users!venues_owner_id_fkey (
    id,
    display_name,
    photo_url
  ),
  addresses (*),
  images (*)
`

export async function fetchActiveVenues(): Promise<VenueWithRelations[]> {
  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from("venues")
    .select(venueSelect)
    .eq("is_active", true)
    .eq("calendar_sync", "connected")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("fetchActiveVenues", error)
    return []
  }

  return (data ?? []) as VenueWithRelations[]
}

export async function fetchVenueBySlug(slug: string): Promise<VenueWithRelations | null> {
  const supabase = createServiceSupabaseClient()
  
  // Check if slug is a valid UUID. If so, search by both slug and id, else only search by slug.
  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(slug || "")
  const orCondition = isUuid ? `slug.eq.${slug},id.eq.${slug}` : `slug.eq.${slug}`

  const { data, error } = await supabase
    .from("venues")
    .select(venueSelect)
    .or(orCondition)
    .eq("is_active", true)
    .eq("calendar_sync", "connected")
    .maybeSingle()

  if (error) {
    console.error("fetchVenueBySlug", error)
    return null
  }

  return data as VenueWithRelations | null
}
