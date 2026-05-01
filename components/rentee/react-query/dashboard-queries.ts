import { getRenteeKPIs } from "@/lib/dashboard/actions"
import { RenteeKPIs } from "@/lib/dashboard/types"
import { ActionResult } from "@/lib/supabase/utils"
import { useQuery } from "@tanstack/react-query"

export const useRenteeKPIsQuery = () => {
  return useQuery<ActionResult<RenteeKPIs>>({
    queryKey: ["rentee-kpis"],
    queryFn: () => getRenteeKPIs(),
  })
}
