import { getOwnerKPIs } from "@/lib/dashboard/actions"
import { OwnerKPIs } from "@/lib/dashboard/types"
import { ActionResult } from "@/lib/supabase/utils"
import { useQuery } from "@tanstack/react-query"

export const useOwnerKPIsQuery = () => {
    return useQuery<ActionResult<OwnerKPIs>>({
        queryKey: ["owner-kpis"],
        queryFn: () => getOwnerKPIs(),
    })
}
