import { useOwnerKPIsQuery } from "../react-query/dashboard-queries"

export const useOwnerKPIs = () => {
  const { data, isError, isLoading, ...rest } = useOwnerKPIsQuery()
  return {
    data: data?.success ? data.data : null,
    isError,
    isLoading,
    ...rest,
  }
}
