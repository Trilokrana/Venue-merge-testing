import {
  useGetSingleListingBySlugQuery,
  useListingsQuery,
} from "@/components/common/react-query/listings-queries"
import { ListingsFilters } from "@/schemas/listings.schema"

export const useListings = (filters: ListingsFilters) => {
  const { data, isError, isLoading, ...rest } = useListingsQuery(filters)
  return {
    data: data?.success ? data.data : null,
    isError,
    isLoading,
    ...rest,
  }
}

export const useSingleListing = (slug: string) => {
  const { data, isError, isLoading, ...rest } = useGetSingleListingBySlugQuery(slug)
  return {
    data: data?.success ? data.data : null,
    isError,
    isLoading,
    ...rest,
  }
}
