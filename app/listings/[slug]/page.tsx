import type { Metadata } from "next"

import { createSupabaseServerClient } from "@/lib/supabase/server-client"

import ErrorState from "@/components/common/ErrorState"
import { getSingleListingBySlug } from "@/lib/listings/actions"
import { VenueDetailView } from "./venue-detail-view"

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await getSingleListingBySlug(slug)
  const venue = data?.success ? data.data : null
  if (!venue) {
    return { title: "Venue not found" }
  }
  return {
    title: `${venue.name} · Venues`,
    description: venue.description?.slice(0, 160) ?? `Book ${venue.name} for your next event.`,
  }
}

export default async function VenueDetailPage({ params }: PageProps) {
  const { slug } = await params
  const data = await getSingleListingBySlug(slug)
  const venue = data?.success ? data.data : null
  if (!venue) {
    return (
      <ErrorState
        title="Listing not found"
        description="We couldn't find the listing you were looking for. Please try again."
      />
    )
  }

  // Check if the logged-in user is this venue's owner
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isOwner = Boolean(user && venue?.owner_id === user?.id)

  return <VenueDetailView venue={venue} isOwner={isOwner} />
}
