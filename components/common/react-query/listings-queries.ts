import { getListings, getSingleListingBySlug } from "@/lib/listings/actions"
import { ActionResult, PaginatedResult } from "@/lib/supabase/utils"
import { ListingsFilters, ListingsWithRelations } from "@/schemas/listings.schema"
import { useQuery } from "@tanstack/react-query"

export const useListingsQuery = (filters: ListingsFilters) => {
  return useQuery<PaginatedResult<ListingsWithRelations>>({
    queryKey: ["listings", filters],
    queryFn: () => getListings(filters),
  })
}

export const useGetSingleListingBySlugQuery = (slug: string) => {
  return useQuery<ActionResult<ListingsWithRelations | null>>({
    queryKey: ["single-listing", slug],
    queryFn: () => getSingleListingBySlug(slug),
  })
}
