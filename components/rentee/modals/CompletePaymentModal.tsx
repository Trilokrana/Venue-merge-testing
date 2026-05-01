"use client"

import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, CreditCard } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"

import { confirmBookingPayment } from "@/lib/bookings/cronofy-actions"
import { BookingWithRelations } from "@/lib/bookings/types"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const step2Schema = z.object({
  cardNumber: z.string().min(15, "Invalid card number"),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/, "Format MM/YY"),
  cvc: z.string().min(3, "Invalid CVC"),
  nameOnCard: z.string().min(1, "Name is required"),
  promoCode: z.string().optional(),
})

type BookingFormValues = z.infer<typeof step2Schema>

interface CompletePaymentModalProps {
  booking: BookingWithRelations
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CompletePaymentModal({ booking, open, onOpenChange }: CompletePaymentModalProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      cardNumber: "",
      expiry: "",
      cvc: "",
      nameOnCard: "",
      promoCode: "",
    },
    mode: "onChange",
  })

  async function onSubmit(data: BookingFormValues) {
    setIsSubmitting(true)
    try {
      // Mock payment processing time
      await new Promise((r) => setTimeout(r, 1500))
      
      const res = await confirmBookingPayment(booking.id)
      if (res.success) {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.removeItem(`pending_booking_${booking.venue_id}`)
        }
        await queryClient.invalidateQueries({ queryKey: ["rentee-bookings"] })
        toast.success("Payment successful! Booking confirmed.", {
          description: "A calendar event is set for your booking."
        })
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error("Payment failed. Please try again.", { description: res?.error })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalAmount = Number(booking.total_amount ?? 0)

  return (
    <Dialog open={open} onOpenChange={(val) => !isSubmitting && onOpenChange(val)}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="size-5" /> Complete Payment
          </DialogTitle>
          <DialogDescription>
            Your booking request for <span className="font-semibold">{booking.venue.name}</span> has been approved! Complete your payment of <span className="font-semibold tabular-nums text-foreground">${totalAmount.toLocaleString()} USD</span> to confirm the reservation.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="cardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Number</FormLabel>
                  <FormControl>
                    <Input placeholder="0000 0000 0000 0000" className="w-full h-10" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 grid-cols-2">
              <FormField
                control={form.control}
                name="expiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration</FormLabel>
                    <FormControl>
                      <Input placeholder="MM/YY" className="w-full h-10" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cvc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CVC</FormLabel>
                    <FormControl>
                      <Input placeholder="123" className="w-full h-10" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="nameOnCard"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name on Card</FormLabel>
                  <FormControl>
                    <Input placeholder="Name on card" className="w-full h-10" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="lg"
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto min-w-35"
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 size-4 animate-spin" /> Processing...</>
                ) : (
                  `Pay $${totalAmount.toFixed(2)}`
                )}
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground pt-2">
              Payments are secure and encrypted.
            </p>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
