"use server"

import * as queries from "@/lib/dashboard/database/queries"
import createClient from "../supabase/server-component-client"
import { ActionResult } from "../supabase/utils"
import requireSession from "../user/require-session"
import { OwnerKPIs, RenteeKPIs } from "./types"

export async function getRenteeKPIs(): Promise<ActionResult<RenteeKPIs>> {
  try {
    const client = await createClient()
    const { user } = await requireSession(client)
    const kpis = await queries.getRenteeKPIs(user.id)
    return kpis
  } catch (error) {
    return { success: false, error: "Failed to fetch rentee KPIs", statusCode: 500 }
  }
}

export async function getOwnerKPIs(): Promise<ActionResult<OwnerKPIs>> {
  try {
    const client = await createClient()
    const { user } = await requireSession(client)
    const kpis = await queries.getOwnerKPIs(user.id)
    return kpis
  } catch (error) {
    return { success: false, error: "Failed to fetch owner KPIs", statusCode: 500 }
  }
}
