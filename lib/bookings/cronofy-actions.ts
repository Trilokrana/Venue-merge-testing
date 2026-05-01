"use server"

import { getValidCronofyAccessTokenForUser } from "@/lib/cronofy/access-token"
import { createCronofyEvent, deleteCronofyEvent } from "@/lib/cronofy/events"
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client"
import { createSupabaseServerClient } from "@/lib/supabase/server-client"
import type { Database } from "@/lib/supabase/database.types"
import requireSession from "@/lib/user/require-session"

export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"]
export type BookingStatus = Database["public"]["Enums"]["booking_status"]

export type CreateBookingInput = {
  venueId: string
  startAt: string
  endAt: string
  notes?: string
  status?: BookingStatus
}

export type CreateBookingResult =
  | { success: true; bookingId: string; calendarEventCreated: boolean }
  | { success: false; error: string }


export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const supabase = await createSupabaseServerClient()
  const { user } = await requireSession(supabase)

  // fetch venue to get owner_id + hourly_rate
  const { data: venue, error: venueErr } = await supabase
    .from("venues")
    .select("id, name, owner_id, hourly_rate")
    .eq("id", input.venueId)
    .eq("is_active", true)
    .maybeSingle()

  if (venueErr || !venue) return { success: false, error: "Venue not found" }
  if (!venue.owner_id) return { success: false, error: "Venue has no owner" }
  if (!venue.hourly_rate) return { success: false, error: "Venue has no hourly rate set" }

  //  Check for booking overlap (active bookings that overlap the requested window)
  const { data: conflicts } = await supabase
    .from("bookings")
    .select("id")
    .eq("venue_id", input.venueId)
    .not("status", "in", '("cancelled_by_guest","cancelled_by_owner")')
    .lt("start_at", input.endAt)
    .gt("end_at", input.startAt)
    .limit(1)

  if (conflicts && conflicts.length > 0) {
    return { success: false, error: "This time slot is already booked. Please choose another time." }
  }

  const { data: externalBusy } = await supabase
    .from("venue_calendar_events")
    .select("id")
    .eq("venue_id", input.venueId)
    .eq("is_external", true)
    .lt("start_time", input.endAt)
    .gt("end_time", input.startAt)
    .limit(1)

  if (externalBusy && externalBusy.length > 0) {
    return {
      success: false,
      error: "This time conflicts with the host’s calendar. Please choose another time.",
    }
  }


  const { data: booking, error: insertErr } = await supabase
    .from("bookings")
    .insert({
      venue_id: input.venueId,
      rentee_id: user.id,
      owner_id: venue.owner_id,
      start_at: input.startAt,
      end_at: input.endAt,
      hourly_rate: venue.hourly_rate,
      status: input.status ?? "confirmed",
      notes: input.notes ?? null,
    })
    .select("id")
    .single()

  if (insertErr || !booking) {
    console.error("[createBooking] insert error", insertErr)
    return { success: false, error: "Could not create booking. Please try again." }
  }


  let calendarEventCreated = false
  try {
    const accessToken = await getValidCronofyAccessTokenForUser(venue.owner_id)
    if (accessToken) {
      const db = getSupabaseAdminClient() ?? supabase
      const { data: venueCalendar } = await db
        .from("venue_calendars")
        .select("cronofy_calendar_id")
        .eq("venue_id", input.venueId)
        .maybeSingle()

      const calendarId = venueCalendar?.cronofy_calendar_id

      let eventUidStr = `booking-${booking.id}`
      if (calendarId) {
        eventUidStr = `${eventUidStr}-${calendarId}`
      }

      const eventUid = await createCronofyEvent({
        accessToken,
        calendarId: calendarId ?? undefined,
        eventUid: eventUidStr,
        summary: input.status === "pending" ? `[Action Required] Booking Request: ${venue.name}` : `Booking: ${venue.name}`,
        description: input.notes
          ? `Guest note: ${input.notes}`
          : `Venue booked by a guest via Supernova Slamdown.`,
        start: { time: input.startAt, tzid: "UTC" },
        end: { time: input.endAt, tzid: "UTC" },
      })

      // Save event id back on the booking (use admin to bypass RLS update policy)
      await db
        .from("bookings")
        .update({ cronofy_event_id: eventUid })
        .eq("id", booking.id)

      calendarEventCreated = true
    }
  } catch (cronofyErr) {
    console.error("[createBooking] Cronofy event creation failed (non-fatal)", cronofyErr)
  }

  return { success: true, bookingId: booking.id, calendarEventCreated }
}


export type CancelBookingResult =
  | { success: true }
  | { success: false; error: string }

/**
 * Cancel a booking.
 * Rentee → sets status = cancelled_by_guest
 * Owner  → sets status = cancelled_by_owner
 * Also deletes the Cronofy calendar event if one was created.
 */
export async function cancelBooking(bookingId: string): Promise<CancelBookingResult> {
  const supabase = await createSupabaseServerClient()
  const { user } = await requireSession(supabase)

  // Fetch booking to determine role
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, rentee_id, owner_id, status, cronofy_event_id")
    .eq("id", bookingId)
    .maybeSingle()

  if (!booking) return { success: false, error: "Booking not found" }
  if (
    booking.status === "cancelled_by_guest" ||
    booking.status === "cancelled_by_owner"
  ) {
    return { success: false, error: "Booking is already cancelled" }
  }

  const isRentee = booking.rentee_id === user.id
  const isOwner = booking.owner_id === user.id
  if (!isRentee && !isOwner) return { success: false, error: "Not authorised" }

  const newStatus: BookingStatus = isRentee ? "cancelled_by_guest" : "cancelled_by_owner"

  const { error: updateErr } = await supabase
    .from("bookings")
    .update({ status: newStatus })
    .eq("id", bookingId)

  if (updateErr) {
    console.error("[cancelBooking] update error", updateErr)
    return { success: false, error: "Could not cancel booking" }
  }

  // Delete Cronofy event (best-effort)
  if (booking.cronofy_event_id) {
    try {
      const accessToken = await getValidCronofyAccessTokenForUser(booking.owner_id)
      if (accessToken) {

        let calendarId: string | undefined
        // Find venue to get correct calendar
        const db = getSupabaseAdminClient() ?? supabase
        const { data: bData } = await db.from("bookings").select("venue_id").eq("id", bookingId).single()
        if (bData?.venue_id) {
          const { data: vCal } = await db.from("venue_calendars").select("cronofy_calendar_id").eq("venue_id", bData.venue_id).single()
          calendarId = vCal?.cronofy_calendar_id ?? undefined
        }

        await deleteCronofyEvent({
          accessToken,
          eventUid: booking.cronofy_event_id,
          calendarId
        })
      }
    } catch (err) {
      console.error("[cancelBooking] Cronofy event delete failed (non-fatal)", err)
    }
  }

  return { success: true }
}


/** Rentee: fetch their upcoming + past bookings (with venue name). */
export async function getMyBookings() {
  const supabase = await createSupabaseServerClient()
  const { user } = await requireSession(supabase)

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id, venue_id, start_at, end_at,
      total_hours, total_amount, hourly_rate,
      status, notes, cronofy_event_id, created_at,
      venues ( id, name, slug )
    `)
    .eq("rentee_id", user.id)
    .order("start_at", { ascending: false })

  if (error) {
    console.error("[getMyBookings]", error)
    return []
  }
  return data ?? []
}

// ─────────────────────────────────────────────────────────────────────────────

/** Owner: fetch every booking across ALL of their venues. */
export async function getAllOwnerVenueBookings() {
  const supabase = await createSupabaseServerClient()
  const { user } = await requireSession(supabase)

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id, venue_id, rentee_id, start_at, end_at,
      total_hours, total_amount, hourly_rate,
      status, notes, cronofy_event_id, created_at,
      venues ( id, name, slug )
    `)
    .eq("owner_id", user.id)
    .order("start_at", { ascending: false })

  if (error) {
    console.error("[getAllOwnerVenueBookings]", error)
    return []
  }
  return data ?? []
}

/** Owner: fetch all bookings for a specific venue. */
export async function getVenueBookings(venueId: string) {
  const supabase = await createSupabaseServerClient()
  const { user } = await requireSession(supabase)

  // Verify ownership
  const { data: venue } = await supabase
    .from("venues")
    .select("id")
    .eq("id", venueId)
    .eq("owner_id", user.id)
    .maybeSingle()

  if (!venue) return []

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id, rentee_id, start_at, end_at,
      total_hours, total_amount, hourly_rate,
      status, notes, cronofy_event_id, created_at
    `)
    .eq("venue_id", venueId)
    .order("start_at", { ascending: false })

  if (error) {
    console.error("[getVenueBookings]", error)
    return []
  }
  return data ?? []
}

import { sendApprovalEmail } from "@/lib/email"

export async function approveBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient()
  const { user } = await requireSession(supabase)
  const adminSupabase = getSupabaseAdminClient()
  const bookingClient = adminSupabase ?? supabase

  const { data: booking, error: bookingErr } = await bookingClient
    .from('bookings')
    .select(`
      id, owner_id, rentee_id, venue_id, status, total_amount
    `)
    .eq('id', bookingId)
    .maybeSingle()

  if (bookingErr) {
    console.error('[approveBooking] booking fetch error', bookingErr)
    return { success: false, error: 'Could not load booking details' }
  }

  const bookingRecord = booking as {
    id: string
    owner_id: string
    rentee_id: string
    venue_id: string
    status: string
    total_amount: number | null
  } | null

  if (!bookingRecord) return { success: false, error: 'Booking not found' }
  if (bookingRecord.owner_id !== user.id) return { success: false, error: 'Not authorised' }
  if (bookingRecord.status !== 'pending') return { success: false, error: 'Booking is not pending' }

  const [{ data: venueRow, error: venueErr }, authUserResult] = await Promise.all([
    bookingClient
      .from('venues')
      .select('name')
      .eq('id', bookingRecord.venue_id)
      .maybeSingle(),
    adminSupabase
      ? adminSupabase.auth.admin.getUserById(bookingRecord.rentee_id)
      : Promise.resolve({ data: { user: null }, error: new Error('Missing SUPABASE_SERVICE_ROLE_KEY') }),
  ])

  const authUserError = authUserResult?.error
  if (authUserError) {
    console.error('[approveBooking] rentee auth lookup error', authUserError)
  }

  if (venueErr) {
    console.error('[approveBooking] venue fetch error', venueErr)
  }

  // Update status to awaiting_payment (industry-standard state machine)
  const { error } = await bookingClient
    .from('bookings')
    .update({ status: 'awaiting_payment' })
    .eq('id', bookingId)

  if (error) {
    console.error('[approveBooking] error', error)
    return { success: false, error: 'Could not approve booking' }
  }
  
  // Send email to Rentee
  try {
      let renteeEmail = authUserResult?.data?.user?.email ?? null
      const venueName = venueRow?.name
      
      console.log('[approveBooking] Attempting to send approval email', {
        bookingId,
        renteeId: bookingRecord.rentee_id,
        authEmailFound: !!renteeEmail,
        renteeEmail: renteeEmail ? renteeEmail.substring(0, 5) + '***' : 'NOT_FOUND'
      })
      
      // Fallback: try public.users table if auth email not found
      if (!renteeEmail) {
        console.log('[approveBooking] Auth email not found, trying public.users fallback...')
        const { data: userRow, error: userErr } = await bookingClient
          .from('users')
          .select('email')
          .eq('id', bookingRecord.rentee_id)
          .maybeSingle()
        
        if (userErr) {
          console.warn('[approveBooking] public.users fallback error:', userErr.message)
        } else if (userRow?.email) {
          renteeEmail = userRow.email
          if (renteeEmail) {
            console.log('[approveBooking] Email found in public.users:', renteeEmail.substring(0, 5) + '***')
          }
        }
      }
    
    if (renteeEmail) {
       console.log('[approveBooking] Sending approval email to:', renteeEmail)
       const emailResult = await sendApprovalEmail({
          to: renteeEmail,
          venueName: venueName || "the venue",
         bookingId: bookingRecord.id,
         amount: Number(bookingRecord.total_amount ?? 0)
       })
       console.log('[approveBooking] Email sent result:', { success: !emailResult?.error, emailId: (emailResult as any)?.id || 'N/A' })
    } else {
      console.warn('[approveBooking]  CRITICAL: Rentee email not found anywhere! Booking ID:', bookingId)
      console.warn('[approveBooking] Rentee ID:', bookingRecord.rentee_id)
    }
  } catch (emailError) {
    console.error('Failed to send approval email (non-fatal)', emailError)
  }

  return { success: true }
}

export async function checkBookingApproval(bookingId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('bookings').select('status, notes').eq('id', bookingId).single()
  if (!data) return false
  if (data.status === 'confirmed') return true
  if (data.notes && data.notes.includes('[OWNER_APPROVED]')) return true
  return false
}

export async function confirmBookingPayment(bookingId: string): Promise<{ success: boolean; error?: string }> {
  const db = getSupabaseAdminClient() || await createSupabaseServerClient()
  
  // Fetch booking details to update cronofy event
  const { data: booking, error: fetchErr } = await db.from('bookings').select(`
    *,
    venues(name)
  `).eq('id', bookingId).single()
  
  if (fetchErr || !booking) {
     return { success: false, error: fetchErr?.message || "Booking not found" }
  }

  const { error } = await db.from('bookings').update({ status: 'confirmed' }).eq('id', bookingId)
  if (error) {
     console.error("[confirmBookingPayment] RLS or DB error", error)
     return { success: false, error: error.message }
  }

  // Update cronofy event if we have one
  if (booking.cronofy_event_id) {
     try {
       const accessToken = await getValidCronofyAccessTokenForUser(booking.owner_id)
       if (accessToken) {
         let calendarId: string | undefined
         if (booking.venue_id) {
           const { data: vCal } = await db.from("venue_calendars").select("cronofy_calendar_id").eq("venue_id", booking.venue_id).single()
           calendarId = vCal?.cronofy_calendar_id ?? undefined
         }
         
         const venueName = (booking.venues as any)?.name ?? "Unknown Venue"
         
         await createCronofyEvent({
            accessToken,
            calendarId: calendarId,
            eventUid: booking.cronofy_event_id,
            summary: `Booking: ${venueName}`,
            description: booking.notes
              ? `Guest note: ${booking.notes}`
              : `Venue booked by a guest via Supernova Slamdown.`,
            start: { time: booking.start_at, tzid: "UTC" },
            end: { time: booking.end_at, tzid: "UTC" },
         })
       }
     } catch (err) {
       console.error("[confirmBookingPayment] Cronofy event update failed (non-fatal)", err)
     }
  }

  return { success: true }
}

export async function rejectBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
  return await cancelBooking(bookingId) // alias for owner rejecting it
}

