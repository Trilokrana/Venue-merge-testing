"use client"

import { BookingWithRelations } from "@/lib/bookings/types"
import { CompletePaymentModal } from "@/components/rentee/modals/CompletePaymentModal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"
import { Calendar } from "lucide-react"
import { format } from "date-fns"

export function CompletePaymentView({ booking }: { booking: BookingWithRelations }) {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  const startDate = booking.start_at ? new Date(booking.start_at) : null
  const dateLabel = startDate ? format(startDate, "EEE, MMM d, yyyy") : ""

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{booking.venue?.name}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="size-4" />
              <span>{dateLabel}</span>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Good news! The owner has approved your booking request. Please complete your payment to finalize the reservation.
            </div>

            <div className="flex items-center justify-between border-t py-4">
              <div>
                <p className="text-sm text-muted-foreground">Total amount due:</p>
                <p className="text-2xl font-bold">
                  ${Number(booking.total_amount ?? 0).toLocaleString()} USD
                </p>
              </div>
              <Button size="lg" onClick={() => setPaymentModalOpen(true)}>
                Pay Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <CompletePaymentModal booking={booking} open={paymentModalOpen} onOpenChange={setPaymentModalOpen} />
    </>
  )
}
