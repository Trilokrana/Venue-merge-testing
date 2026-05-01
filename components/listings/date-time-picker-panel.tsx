"use client"

import { format } from "date-fns"
import { Clock } from "lucide-react"
import * as React from "react"

import { getTimeSlotOptions } from "@/app/listings/data"
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { DayPickerProps } from "react-day-picker"
import { Button } from "../ui/button"

const TIME_OPTIONS = getTimeSlotOptions()

type Props = {
  date: Date | undefined
  startTime: string
  endTime: string
  onDateChange: (d: Date | undefined) => void
  onStartTimeChange: (t: string) => void
  onEndTimeChange: (t: string) => void
  /** Slot string → display label for busy slots (e.g. "Maintenance", "Booked") */
  busySlots?: Map<string, string>
  timeOptions?: string[]
  calendarProps?: Omit<DayPickerProps, "mode" | "selected" | "onSelect"> & {
    buttonVariant?: React.ComponentProps<typeof Button>["variant"]
  }
}

export function DateTimePickerPanel({
  date,
  startTime,
  endTime,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  busySlots,
  timeOptions = TIME_OPTIONS,
  calendarProps = {},
}: Props) {
  const durationHours = React.useMemo(() => {
    const si = timeOptions.indexOf(startTime)
    const ei = timeOptions.indexOf(endTime)
    if (si < 0 || ei < 0 || ei <= si) return null
    const minutes = (ei - si) * 30
    return (minutes / 60).toFixed(1)
  }, [startTime, endTime, timeOptions])

  return (
    <div className="flex flex-col gap-0 md:flex-row">
      <div className="p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          className="rounded-xl [--cell-size:--spacing(9)]"
          components={{
            DayButton: (btnProps) => (
              <CalendarDayButton
                {...btnProps}
                className="group-data-[focused=true]/day:border-primary group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-primary/35 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[selected-single=true]:hover:bg-primary data-[selected-single=true]:hover:text-primary-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground dark:data-[selected-single=true]:bg-primary"
              />
            ),
          }}
          captionLayout="dropdown"
          {...calendarProps}
        />
      </div>
      <div className="flex min-w-[260px] flex-col gap-3 border-t p-4 md:border-t-0">
        {durationHours ? (
          <p className="text-sm font-medium text-primary">{durationHours} hours selected</p>
        ) : (
          <p className="text-sm text-muted-foreground">Pick start and end time</p>
        )}
        <div className="space-y-2">
          <Label className="">Start time</Label>
          <Select value={startTime} onValueChange={onStartTimeChange}>
            <SelectTrigger className="h-11 w-full gap-2 border-input bg-background px-3 text-sm font-medium transition-colors hover:border-ring focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 data-[state=open]:border-primary">
              <Clock className="size-4 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Start time" />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-primary/25">
              {timeOptions.map((t) => {
                const busyLabel = busySlots?.get(t)
                return (
                  <SelectItem key={t} value={t} disabled={!!busyLabel}>
                    <span className={busyLabel ? "text-muted-foreground line-through" : undefined}>
                      {t}
                    </span>
                    {busyLabel ? (
                      <span className="ml-2 text-xs text-muted-foreground">{busyLabel}</span>
                    ) : null}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="">End time</Label>
          <Select value={endTime} onValueChange={onEndTimeChange}>
            <SelectTrigger className="h-11 w-full gap-2 border-input bg-background px-3 text-sm font-medium transition-colors hover:border-ring focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 data-[state=open]:border-primary">
              <Clock className="size-4 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="End time" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              {timeOptions.map((t) => {
                const busyLabel = busySlots?.get(t)
                return (
                  <SelectItem key={`e-${t}`} value={t} disabled={!!busyLabel}>
                    <span className={busyLabel ? "text-muted-foreground line-through" : undefined}>
                      {t}
                    </span>
                    {busyLabel ? (
                      <span className="ml-2 text-xs text-muted-foreground">{busyLabel}</span>
                    ) : null}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm font-semibold">
          {date ? format(date, "MMMM d, yyyy") : "Select a date"}
        </p>
      </div>
    </div>
  )
}
