"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Calendar, ChevronRight, Clock, Loader2, MapPin, Star, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { createBooking, checkBookingApproval, confirmBookingPayment } from "@/lib/bookings/cronofy-actions"
import { formatLocationLine, normalizeAddress, primaryImageUrl } from "@/app/listings/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import type { VenueWithRelations } from "@/lib/venues/types"

const step1Schema = z.object({
  activity: z.string().min(1, "Activity is required"),
  castCrew: z.string().min(1, "Cast & Crew count is required"),
  projectName: z.string().min(1, "Project name is required"),
  company: z.string().min(1, "Renter/Company is required"),
  about: z.string().min(10, "Tell us more about your project (min 10 characters)"),
})

const step2Schema = z.object({
  cardNumber: z.string().min(15, "Invalid card number"),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/, "Format MM/YY"),
  cvc: z.string().min(3, "Invalid CVC"),
  nameOnCard: z.string().min(1, "Name is required"),
  promoCode: z.string().optional(),
})

const bookingSchema = step1Schema.merge(step2Schema)
type BookingFormValues = z.infer<typeof bookingSchema>

type Props = {
  venue: VenueWithRelations
  date: Date
  startTime: string
  endTime: string
  guests: string
  effectiveHours: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

const GUEST_BUCKETS = [
  { label: "1 – 5 people", value: "5", multiplier: 1 },
  { label: "6 – 20 people", value: "20", multiplier: 1.35 },
  { label: "21 – 50 people", value: "50", multiplier: 1.8 },
  { label: "51 – 100 people", value: "100", multiplier: 2.5 },
  { label: "100+ people", value: "200", multiplier: 3.4 },
] as const

const ACTIVITIES = [
  "Christmas Party",
  "Birthday Party",
  "Wedding",
  "Corporate Event",
  "Photo Shoot",
  "Meeting",
  "Music Video",
  "Party",
  "Seminar",
  "Gala",
  "Concert",
  "Product Launch",
  "Baby Shower",
  "Recreation",
  "Production",
  "Event",
] as const

export function BookingFormSheet({
  venue,
  date,
  startTime,
  endTime,
  guests,
  effectiveHours,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter()
  const [step, setStep] = React.useState<1 | 2>(1)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [pendingBookingId, setPendingBookingId] = React.useState<string | null>(null)
  const [isPolling, setIsPolling] = React.useState(false)

  // Pricing recalculation
  const baseRate = venue.hourly_rate ?? 0
  const selectedGuestBucket = GUEST_BUCKETS.find((b) => b.value === guests)
  const attendeeMultiplier = selectedGuestBucket?.multiplier ?? 1
  const dynamicHourlyRate = baseRate > 0 ? baseRate * attendeeMultiplier : 0
  const subtotal = dynamicHourlyRate * effectiveHours
  const processing = subtotal * 0.15
  const total = subtotal + processing

  const address = normalizeAddress(venue)
  const heroImage = primaryImageUrl(venue)

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      activity: "",
      castCrew: guests,
      projectName: "",
      company: "",
      about: "",
      cardNumber: "",
      expiry: "",
      cvc: "",
      nameOnCard: "",
      promoCode: "",
    },
    mode: "onChange",
  })

  // Watch for external changes to guests
  React.useEffect(() => {
    form.setValue("castCrew", guests)
  }, [guests, form])

  // Note: For non-instabook, no polling is needed; it redirects after request
  React.useEffect(() => {
    // Only used for instabook if we ever implement deferred instabook payments, 
    // but for now instabook goes straight to step 2 in handleNext.
  }, [venue.id, pendingBookingId])

  React.useEffect(() => {
    // Polling removed: Asynchronous approval is now handled via Email/Dashboard
    return () => {}
  }, [pendingBookingId, isPolling])

  async function handleNext() {
    const isValid = await form.trigger(["activity", "castCrew", "projectName", "company", "about"])
    
    if (isValid) {
      if (!venue.instabook) {
        setIsSubmitting(true);
        await submitBookingRequest(form.getValues(), true); 
      } else {
        setStep(2)
      }
    }
  }

  async function submitBookingRequest(data: BookingFormValues, isRequest: boolean = false) {
    if (!date || !startTime || !endTime) {
      toast.error("Invalid date or time.")
      setIsSubmitting(false)
      return
    }

    // Convert "10:00 AM" on the selected date to UTC ISO string
    function slotToISO(dateBase: Date, slot: string): string {
      const [timePart, period] = slot.split(" ")
      const [hStr, mStr] = timePart.split(":")
      let h = parseInt(hStr, 10)
      const m = parseInt(mStr, 10)
      if (period === "PM" && h !== 12) h += 12
      if (period === "AM" && h === 12) h = 0
      const d = new Date(dateBase)
      d.setHours(h, m, 0, 0)
      return d.toISOString()
    }

    setIsSubmitting(true)
    try {
      const fullNotes = `Project: ${data.projectName}\nCompany: ${data.company}\nActivity: ${data.activity}\nCast & Crew: ${data.castCrew}\n\nAbout:\n${data.about}\n\n(Payment skipped for now)`

      const result = await createBooking({
        venueId: venue.id,
        startAt: slotToISO(date, startTime),
        endAt: slotToISO(date, endTime),
        notes: fullNotes,
        status: isRequest ? "pending" : "confirmed"
      })

      if (!result.success) {
        toast.error("Booking failed", { description: result.error })
        return
      }

      if (isRequest) {
        toast.success("Booking request sent!", {
          description: "Your request is pending owner approval. You will be notified to confirm payment upon approval.",
        })
        onOpenChange(false)
        router.push("/bookings")
      } else {
        toast.success("Booking confirmed!", {
          description: result.calendarEventCreated
            ? "A calendar event has been added to the owner's calendar."
            : "Your booking is confirmed.",
        })
        onOpenChange(false)
        router.push("/bookings")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function onSubmit(data: BookingFormValues) {
    if (step === 1) return
    if (!venue.instabook) {
      if (!pendingBookingId) return
      setIsSubmitting(true)
      try {
        // Mock payment processing time
        await new Promise((r) => setTimeout(r, 1500))
        
        const res = await confirmBookingPayment(pendingBookingId)
        if (res.success) {
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.removeItem(`pending_booking_${venue.id}`)
          }
          toast.success("Payment successful! Booking confirmed.", {
            description: "A calendar event is set for your booking."
          })
          onOpenChange(false)
          router.push("/bookings")
        } else {
          toast.error("Payment failed. Please try again.", { description: res.error })
        }
      } finally {
        setIsSubmitting(false)
      }
    } else {
      // Instant book directly created
      await submitBookingRequest(data, false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl md:max-w-175 lg:max-w-250 overflow-y-auto px-4 py-4 sm:px-8">
        <SheetHeader className="px-0 text-left">
          <SheetTitle className="text-2xl font-bold">
            {step === 1 ? (venue.instabook ? "Instant Book" : "Request to Book") : "Complete Payment"}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <span className={step >= 1 ? "font-medium text-foreground" : ""}>
              1. Details
            </span>
            <ChevronRight className="size-4" />
            <span className={step >= 2 ? "font-medium text-foreground" : ""}>
              2. Payment
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6">
          <Card className="rounded-2xl border shadow-sm border-border/60 overflow-hidden sm:max-w-md">
            <div className="flex flex-row px-4  gap-2 bg-background items-start">
              {heroImage ? (
                <img src={heroImage} alt={venue.name} className="size-20 shrink-0 rounded-lg object-cover border border-border/50" />
              ) : (
                <div className="size-20 shrink-0 rounded-lg bg-muted border border-border/50" />
              )}
              <div className="flex flex-col gap-0.5 min-w-0">
                <h3 className="font-semibold text-lg text-foreground truncate">{venue.name}</h3>
                <div className="flex items-start gap-1.5 text-sm text-muted-foreground mt-0.5">
                  <MapPin className="size-4 shrink-0 text-primary mt-0.5" />
                  <span className="line-clamp-2 leading-tight">{formatLocationLine(address)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm mt-0.5">
                  <Star className="size-4 fill-[#f59e0b] text-[#f59e0b]" />
                  <span className="font-bold text-foreground text-xs tracking-wide uppercase">New</span>
                  <span className="text-muted-foreground text-xs">({venue.rating || "4.9"} Rating)</span>
                </div>
              </div>
            </div>

            <Separator className="mx-4 w-auto" />

            <div className="px-4 bg-background">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Booking Details</p>
              <div className="flex items-center gap-3 text-foreground text-sm">
                <Calendar className="size-4 text-primary/80" />
                <span>{format(date, "MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-3 text-foreground text-sm">
                <Clock className="size-4 text-primary/80" />
                <span>{startTime} – {endTime}</span>
              </div>
              <div className="flex items-center gap-3 text-foreground text-sm">
                <Users className="size-4 text-primary/80" />
                <span>{effectiveHours.toFixed(1)} Hours • {selectedGuestBucket?.label}</span>
              </div>
            </div>

            <Separator className="mx-4 w-auto" />

            <div className="px-4 py-2 bg-background">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Price Summary</p>
              <div className="flex justify-between items-start text-sm text-foreground">
                <div className="flex flex-col gap-0.5">
                  <span>Base Fee ({effectiveHours.toFixed(1)} hours)</span>
                  <span className="text-muted-foreground text-xs">${dynamicHourlyRate.toFixed(2)} / hour x {effectiveHours.toFixed(1)} hrs</span>
                </div>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-foreground">
                <span>Processing Fee</span>
                <span>${processing.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-muted/40 px-4 py-2 flex justify-between items-center border-t border-border/50">
              <span className="font-bold text-base text-foreground">Total (USD)</span>
              <span className="font-bold text-xl text-primary">${total.toFixed(2)}</span>
            </div>
          </Card>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="activity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Activity</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full h-10">
                                <SelectValue placeholder="Select activity" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ACTIVITIES.map((act) => (
                                <SelectItem key={act} value={act}>
                                  {act}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="castCrew"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Attendees</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full h-10">
                                <SelectValue placeholder="Select attendees" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {GUEST_BUCKETS.map((b) => (
                                <SelectItem key={b.value} value={b.value}>
                                  {b.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="projectName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Name</FormLabel>
                          <FormControl>
                            <Input placeholder="E.g. Summer Campaign" className="w-full h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Renter/Company</FormLabel>
                          <FormControl>
                            <Input placeholder="Company Name" className="w-full h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="about"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>About your project</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Share details with the host..."
                            className="min-h-24"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="pt-4 flex justify-end">
                    <Button type="button" onClick={handleNext} disabled={isSubmitting || isPolling} size="lg" className="w-full sm:w-auto">
                      {isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                      ) : isPolling ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Waiting for Approval...</>
                      ) : venue.instabook ? (
                        "Proceed to Payment"
                      ) : (
                        "Request to Book"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="cardNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Card Number</FormLabel>
                        <FormControl>
                          <Input placeholder="0000 0000 0000 0000" className="w-full h-10" {...field} />
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
                            <Input placeholder="MM/YY" className="w-full h-10" {...field} />
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
                            <Input placeholder="123" className="w-full h-10" {...field} />
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
                          <Input placeholder="Name on card" className="w-full h-10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-full sm:w-auto"
                    >
                      Back
                    </Button>
                    <Button
                      size="lg"
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-45"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="mr-2 size-4 animate-spin" /> Confirming…</>
                      ) : (
                        `Pay $${total.toFixed(2)}`
                      )}
                    </Button>
                  </div>
                  <p className="text-center text-xs text-muted-foreground pt-4">
                    Payments are secure and encrypted.
                  </p>
                </div>
              )}
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
