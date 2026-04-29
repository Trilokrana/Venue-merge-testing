"use server"
import * as queries from "@/lib/listings/database/queries"
import { ListingsFilters, ListingsWithRelations } from "@/schemas/listings.schema"
import { ActionResult, Meta, PaginatedResult } from "../supabase/utils"

export async function getListings(
  filters?: ListingsFilters
): Promise<PaginatedResult<ListingsWithRelations>> {
  try {
    // const client = await createClient()
    // await requireSession(client)

    const listings = await queries.getFilteredListings({
      filters,
      page: filters?.page ?? 1,
      pageSize: filters?.perPage ?? 24,
    })

    return {
      success: true,
      data: {
        items: listings.items ?? [],
        meta: listings.meta as Meta,
      },
      statusCode: 200,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch your listings",
      statusCode: 500,
    }
  }
}

// Get venues for current owner (authorized)
export async function getSingleListingBySlug(
  slug: string
): Promise<ActionResult<ListingsWithRelations>> {
  try {
    const trimmed = slug?.trim() ?? ""
    if (!trimmed) {
      return {
        success: false,
        error: "A Listing slug is required in the URL.",
        statusCode: 400,
      }
    }

    const venue = await queries.getSingleListingBySlug(trimmed)

    if (!venue) {
      return {
        success: false,
        error:
          "We could not find a listing with this link. It may have been removed, or the URL may be wrong.",
        statusCode: 404,
      }
    }

    return {
      success: true,
      data: venue as unknown as ListingsWithRelations,
      statusCode: 200,
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Could not load this listing. Please try again.",
      statusCode: 500,
    }
  }
}
