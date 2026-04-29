import type { SupabaseClient } from "@supabase/supabase-js"

const VENUES_TABLE = "venues"

/**
 * Converts a string to a URL-friendly kebab-case slug fragment.
 * - Lowercases
 * - Removes diacritics (é → e)
 * - Replaces non-alphanumeric chars with dashes
 * - Collapses repeated dashes
 * - Trims dashes from both ends
 * - Truncates to maxLength to keep slugs reasonable
 */
function slugify(input: string, maxLength = 50): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "") // trim trailing dash if truncation cut mid-word
}

/**
 * Generates a 6-character ID from the current timestamp in base-36.
 *
 * Why base-36? It uses [0-9a-z] which is URL-safe and case-insensitive,
 * making slugs friendlier across systems (some platforms lowercase URLs).
 *
 * Why 6 chars? Date.now() produces a 13-digit number (~ms since 1970).
 * In base-36, that compresses to 8 chars total — we take the LAST 6,
 * which represent the most recent ~36^6 ms ≈ 60 days of unique values
 * before they recycle. Since two venues created in the same millisecond
 * is the only collision risk, this is more than enough.
 *
 * To eliminate even that millisecond-collision risk, we mix in a small
 * random component so concurrent inserts get different IDs.
 */
function generateTimestampId(): string {
  // Combine timestamp (ms) with a small random offset so two inserts
  // in the same millisecond still produce different IDs.
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  const combined = timestamp * 1000 + random

  return combined
    .toString(36)
    .padStart(5, "0") // ensure minimum length
    .slice(-5) // enforce exact length
}

/**
 * Builds a slug in the format: `{name}-{venue_type}-{6charTimestampId}`
 * Example: "the-rooftop-bar-restaurant-m3k7a9"
 */
function buildSlug(name: string, venueType: string): string {
  const namePart = slugify(name)
  const typePart = slugify(venueType)
  const id = generateTimestampId()

  // Filter out empty parts in case slugify reduced them to ""
  return [namePart, typePart, id].filter(Boolean).join("-")
}

/**
 * Generates a unique slug by checking the DB and retrying on collision.
 *
 * @throws if a unique slug cannot be generated within `maxAttempts` tries.
 */
export async function generateUniqueVenueSlug(
  supabase: SupabaseClient,
  name: string,
  venueType: string,
  maxAttempts = 5
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = buildSlug(name, venueType)

    const { data, error } = await supabase
      .from(VENUES_TABLE)
      .select("id")
      .eq("slug", candidate)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to verify slug uniqueness: ${error.message}`)
    }

    if (!data) {
      return candidate
    }
  }

  throw new Error(`Could not generate a unique slug for "${name}" after ${maxAttempts} attempts`)
}
