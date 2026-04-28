"use client"

import { format, isBefore, startOfDay } from "date-fns"
import { CalendarDays, ChevronDown, Info, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"

import { getTimeSlotOptions } from "@/app/listings/data"
import { DateTimePickerPanel } from "@/components/listings/date-time-picker-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

/** Convert a slot label like "6:00 AM" or "1:30 PM" to minutes since midnight. */
function slotToMinutes(slot: string): number {
  const [timePart, period] = slot.split(" ")
  const [hStr, mStr] = timePart.split(":")
  let h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  if (period === "PM" && h !== 12) h += 12
  if (period === "AM" && h === 12) h = 0
  return h * 60 + m
}

type BookedRange = { start: string; end: string; title?: string; type?: string }

/** Build a map of 30-min slot string → display label for slots that overlap booked ranges. */
function computeBusySlots(date: Date, bookedRanges: BookedRange[]): Map<string, string> {
  if (!bookedRanges.length) return new Map()
  const slots = getTimeSlotOptions()
  const busy = new Map<string, string>()

  for (const slot of slots) {
    const mins = slotToMinutes(slot)
    const slotStart = new Date(date)
    slotStart.setHours(Math.floor(mins / 60), mins % 60, 0, 0)
    const slotEnd = new Date(slotStart.getTime() + 30 * 60_000)

    for (const r of bookedRanges) {
      const rStart = new Date(r.start)
      const rEnd = new Date(r.end)
      if (slotStart < rEnd && slotEnd > rStart) {
        busy.set(slot, r.title || "Busy")
        break
      }
    }
  }
  return busy
}

const SLOTS = getTimeSlotOptions()

function slotIndex(t: string) {
  return SLOTS.indexOf(t)
}

function hoursBetween(start: string, end: string) {
  const a = slotIndex(start)
  const b = slotIndex(end)
  if (a < 0 || b < 0 || b <= a) return 0
  return ((b - a) * 30) / 60
}

const GUEST_BUCKETS = [
  { label: "1 – 5 people", value: "5", multiplier: 1 },
  { label: "6 – 20 people", value: "20", multiplier: 1.35 },
  { label: "21 – 50 people", value: "50", multiplier: 1.8 },
  { label: "51 – 100 people", value: "100", multiplier: 2.5 },
  { label: "100+ people", value: "200", multiplier: 3.4 },
] as const

type Props = {
  venueId: string
  hourlyRate: number | null
  minHours: number | null
  capacity: number | null
  className?: string
}

export function VenueBookingWidget({ venueId, hourlyRate, minHours, capacity, className }: Props) {
  const router = useRouter()
  const [date, setDate] = React.useState<Date | undefined>(undefined)
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [startTime, setStartTime] = React.useState("")
  const [endTime, setEndTime] = React.useState("")
  const [guests, setGuests] = React.useState("")
  const [busySlots, setBusySlots] = React.useState<Map<string, string>>(new Map())

  React.useEffect(() => {
    if (!date) {
      setBusySlots(new Map())
      return
    }
    const dateStr = format(date, "yyyy-MM-dd")
    const selectedDate = date
    let cancelled = false

    fetch(`/api/venues/${venueId}/availability?date=${dateStr}`)
      .then(async (r) => {
        if (cancelled) return
        if (!r.ok) {
          setBusySlots(new Map(SLOTS.map((s) => [s, "Unavailable"])))
          return
        }
        const data: { bookedRanges?: BookedRange[] } = await r.json()
        setBusySlots(computeBusySlots(selectedDate, data.bookedRanges ?? []))
      })
      .catch(() => {
        if (!cancelled) setBusySlots(new Map(SLOTS.map((s) => [s, "Unavailable"])))
      })

    return () => {
      cancelled = true
    }
  }, [date, venueId])

  const hours = React.useMemo(() => hoursBetween(startTime, endTime), [startTime, endTime])
  const effectiveHours = Math.max(hours, minHours ?? 0)
  const hasDateTime = Boolean(date && startTime && endTime && hours > 0)
  const hasGuests = Boolean(guests)

  /** True if any 30-min step between start and end falls on a booked slot (prevents spanning through busy time). */
  const selectionCrossesBooked = React.useMemo(() => {
    if (!date || !startTime || !endTime) return false
    const a = slotIndex(startTime)
    const b = slotIndex(endTime)
    if (a < 0 || b < 0 || b <= a) return false
    for (let i = a; i < b; i++) {
      if (busySlots.has(SLOTS[i])) return true
    }
    return false
  }, [date, startTime, endTime, busySlots])

  const readyToBook = hasDateTime && hasGuests && !selectionCrossesBooked

  const baseRate = hourlyRate ?? 0
  const selectedGuestBucket = GUEST_BUCKETS.find((b) => b.value === guests)
  const attendeeMultiplier = selectedGuestBucket?.multiplier ?? 1
  const dynamicHourlyRate = baseRate > 0 ? baseRate * attendeeMultiplier : 0
  const displayedHourlyRate = baseRate > 0 ? (hasGuests ? dynamicHourlyRate : baseRate) : null
  const subtotal = dynamicHourlyRate > 0 ? dynamicHourlyRate * effectiveHours : 0
  const processing = subtotal * 0.15
  const total = subtotal + processing
  const showPricingBreakdown = readyToBook && dynamicHourlyRate > 0

  const dateLine = date ? format(date, "MMM d") : "Pick day and time"
  const timeLine = hasDateTime ? `${startTime} – ${endTime}` : "Add your start and end time"
  const selectedGuestLabel = selectedGuestBucket?.label ?? ""

  return (
    <Card
      className={cn(
        "overflow-hidden p-0 border-0 ring-0 rounded-bl-none shadow-none data-[size=sm]:gap-0 data-[size=sm]:py-0 data-[size=sm]:px-0",
        className
      )}
      size="sm"
    >
      <CardContent className="space-y-4 group-data-[size=sm]/card:px-0">
        <div className="flex min-h-14 flex-wrap items-start justify-between gap-2">
          <div>
            {displayedHourlyRate != null ? (
              <>
                <p className="text-2xl font-semibold tabular-nums ">
                  ${Math.round(displayedHourlyRate).toLocaleString()}{" "}
                  <span className="text-base font-medium text-muted-foreground">USD/hr</span>
                </p>
                {minHours != null ? (
                  <p className="text-sm text-muted-foreground">{minHours} hr. minimum</p>
                ) : null}
              </>
            ) : (
              <p className="text-xl font-semibold ">Request a quote</p>
            )}
          </div>
        </div>

        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              // variant={"de"}
              className="w-full h-full py-2"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <CalendarDays className="size-5 shrink-0" />
                <div className="min-w-0 flex flex-col items-start">
                  <p className="font-semibold ">{dateLine}</p>
                  <p className="text-xs">{timeLine}</p>
                </div>
              </div>
              <ChevronDown className="size-4 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto max-w-[calc(100vw-2rem)] shadow-lg p-0 max-h-[calc(80vh-2rem)] overflow-y-scrollsm:overflow-y-hidden"
            align="center"
          >
            <div>
              <DateTimePickerPanel
                date={date}
                startTime={startTime}
                endTime={endTime}
                onDateChange={setDate}
                onStartTimeChange={setStartTime}
                onEndTimeChange={setEndTime}
                busySlots={busySlots}
                calendarProps={{
                  disabled: (date) => isBefore(date, startOfDay(new Date())),
                }}
              />
              <div className="flex justify-end gap-2 border-t p-1.5 px-3">
                <Button
                  type="button"
                  variant="ghost"
                  // className="rounded-xl"
                  onClick={() => {
                    setDate(undefined)
                    setStartTime("")
                    setEndTime("")
                  }}
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  className="px-5"
                  onClick={() => setPickerOpen(false)}
                >
                  Save date
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {hasDateTime && selectionCrossesBooked ? (
          <p className="text-sm text-destructive">
            Part of this time range is already booked. Adjust start or end so it doesn&apos;t
            overlap.
          </p>
        ) : null}

        {hasDateTime ? (
          <div className="-mt-2 flex items-center justify-between px-1 text-sm">
            <button
              type="button"
              className="text-muted-foreground  underline underline-offset-2 hover:text-foreground"
              onClick={() => setPickerOpen(true)}
            >
              Add a day
            </button>
            <button
              type="button"
              className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
              onClick={() => {
                setDate(undefined)
                setStartTime("")
                setEndTime("")
              }}
            >
              Clear dates
            </button>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label className="text-base font-semibold text-muted-foreground">Attendees</Label>
          <Select value={guests} onValueChange={setGuests}>
            <SelectTrigger className="w-full justify-start gap-0 rounded-sm py-2.5 text-left focus-visible:border-primary focus-visible:ring-primary/20 [&>svg]:ml-auto *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:justify-start">
              <Users className="mr-2 size-4 shrink-0 text-muted-foreground/90" />
              <SelectValue placeholder="Select attendees" className="text-muted-foreground" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-primary/25 **:data-[slot=select-item]:pl-4 **:data-[slot=select-item]:pr-10">
              {GUEST_BUCKETS.map((b) => (
                <SelectItem key={b.value} value={b.value}>
                  <span className="inline-flex w-full items-center">
                    <span className="min-w-0 flex-1 truncate text-left">{b.label}</span>
                    {baseRate > 0 ? (
                      <span className="ml-6 min-w-35 text-right tabular-nums whitespace-nowrap text-muted-foreground">
                        ${Math.round(baseRate * b.multiplier).toLocaleString()} USD/hr
                      </span>
                    ) : null}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {capacity != null ? (
            <p className="text-xs text-muted-foreground">
              Venue capacity: up to {capacity.toLocaleString()} guests
            </p>
          ) : null}
        </div>

        {readyToBook ? (
          <>
            <div className="rounded-2xl border p-3 text-xs leading-relaxed text-muted-foreground">
              <div className="flex gap-2">
                <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground/90" />
                <span>
                  Reservations are not final until the host confirms. Free cancellation within 24
                  hours of booking request where applicable.
                </span>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => {
                const q = new URLSearchParams({
                  date: date?.toISOString() || "",
                  startTime,
                  endTime,
                  guests,
                  hours: effectiveHours.toString(),
                })
                router.push(`/request-booking/${venueId}?${q.toString()}`)
              }}
              className="w-full"
              disabled={displayedHourlyRate == null}
            >
              {displayedHourlyRate != null ? "Reserve" : "Request availability"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Cancel for free within 24 hours · High acceptance rate
            </p>

            {showPricingBreakdown ? (
              <>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4 text-muted-foreground">
                    <span>
                      ${dynamicHourlyRate.toFixed(2)} USD × {effectiveHours.toFixed(1)} hours
                    </span>
                    <span className="tabular-nums font-medium">${subtotal.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Attendees</span>
                    <span className="tabular-nums">{selectedGuestLabel}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="inline-flex items-center gap-1">
                      Processing fee
                      <Info className="size-3.5 text-muted-foreground/90" />
                    </span>
                    <span className="tabular-nums">${processing.toFixed(2)} USD</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between gap-4 font-semibold ">
                    <span>Total</span>
                    <span className="tabular-nums">${total.toFixed(2)} USD</span>
                  </div>
                </div>
              </>
            ) : null}
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
