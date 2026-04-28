import { VenueAddress, VenueImage, VenueOwner, VenueType } from "@/lib/venues/types"
import z from "zod"
import { eventTypeEnum, indoorOutdoorEnum, venueTypeEnum } from "./venue.schema"

// schemas/listings.schema.ts

export const listingsFiltersSchema = z
  .object({
    query: z.string().optional(),
    venue_type: venueTypeEnum.optional(),

    // Frontend sends array of event types
    event_types: z.array(eventTypeEnum).optional(),

    city: z.string().optional(),

    // Accept either parsed numbers OR raw "min,max" strings from URL
    min_capacity: z.number().int().positive().optional(),
    max_capacity: z.number().int().positive().optional(),
    max_hourly_rate: z.number().positive().optional(),

    // Accept "min,max" range string from URL
    min_hours: z.string().optional(),

    amenities: z.array(z.string()).optional(),
    indoor_outdoor: indoorOutdoorEnum.optional(),
    instabook: z.boolean().optional(),

    // Availability search (from VenueSearchBar)
    planning: z.string().optional(),
    place: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    date: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.min_capacity && data.max_capacity) {
        return data.max_capacity >= data.min_capacity
      }
      return true
    },
    {
      message: "Maximum capacity must be greater than minimum capacity",
      path: ["max_capacity"],
    }
  )

export type ListingsFilters = z.infer<typeof listingsFiltersSchema> & {
  page?: number | null
  perPage?: number | null
}

export type ListingsRow = {
  id: string
  name: string
  phone: string[] | null
  capacity: number | null
  rating: number | null
  venue_type: VenueType
  owner_id: string | null
  indoor_outdoor: string | null
  square_footage: number | null
  description: string | null
  amenities: string[] | null
  parking: string[] | null
  accessibility: string[] | null
  audio_system: string[] | null
  hours_of_operation: string | null
  cancellation_policy: string | null
  social_media_links: string[] | null
  is_active: boolean
  created_at: string
  slug: string | null
  event_types: string[] | null
  rules: string[] | null
  instabook: boolean
  hourly_rate: number | null
  min_hours: number | null
  /** Set when owner has linked Cronofy / calendar sync for this venue */
  calendar_sync?: "not_connected" | "connected" | null
  /** True when venue has at least one active booking (pending/confirmed, not ended). */
  is_booked?: boolean
}

export type ListingsWithRelations = ListingsRow & {
  addresses: VenueAddress | VenueAddress[] | null
  images: VenueImage[] | null
  owner?: VenueOwner | VenueOwner[] | null
}
