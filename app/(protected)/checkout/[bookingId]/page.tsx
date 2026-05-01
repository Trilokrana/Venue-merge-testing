import { createSupabaseServerClient } from "@/lib/supabase/server-client"
import { notFound, redirect } from "next/navigation"
import { CompletePaymentView } from "@/components/rentee/checkout/complete-payment-view"
import { BookingWithRelations } from "@/lib/bookings/types"

export default async function CheckoutPage({ params }: { params: { bookingId: string } }) {
    const db = await createSupabaseServerClient()
    const { data: user } = await db.auth.getUser()

    if (!user.user) {
        redirect("/login")
    }



    const { data: booking, error } = await db
        .from("bookings")
        .select(`
      *,
      venue:venues (
        *,
        images:venue_images(*),
        addresses:venue_addresses(*)
      )
    `)
        .eq("id", params.bookingId)
        .single()

    if (!booking || error) {
        return notFound()
    }

    const isAwaitingPayment = booking.status === "awaiting_payment"

    if (!isAwaitingPayment) {
        redirect("/bookings")
    }

    return (
        <div className="max-w-lg mx-auto py-12 px-4">
            <h1 className="text-2xl font-bold mb-4">Checkout</h1>
            <CompletePaymentView booking={booking as unknown as BookingWithRelations} />
        </div>
    )
}
