import { useRenteeKPIsQuery } from "../react-query/dashboard-queries"

export const useRenteeKPIs = () => {
  const { data, isError, isLoading, ...rest } = useRenteeKPIsQuery()
  return {
    data: data?.success ? data.data : null,
    isError,
    isLoading,
    ...rest,
  }
}
