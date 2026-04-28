import type { Metadata } from "next"

import { ListingsPageV2 } from "./listings-page-v2"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Venue listings",
  description:
    "Search venues by event type, location, and time. Compare spaces side by side with the map.",
}

export default async function ListingsPage() {
  return <ListingsPageV2 />
}
