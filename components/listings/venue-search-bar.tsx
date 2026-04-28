"use client"

import { Autocomplete } from "@react-google-maps/api"
import { format, isBefore, startOfDay } from "date-fns"
import { Search, X } from "lucide-react"
import * as React from "react"

import { PLANNING_OPTIONS } from "@/app/listings/data"
import { DateTimePickerPanel } from "@/components/listings/date-time-picker-panel"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { VariantProps } from "class-variance-authority"

export type SearchPlace = {
  lat: number
  lng: number
  label: string
}

type Size = "sm" | "md" | "lg"

type Props = {
  mapsLoaded: boolean
  planning: string
  onPlanningChange: (v: string) => void
  place: SearchPlace | null
  onPlaceChange: (p: SearchPlace | null) => void
  date: Date | undefined
  onDateChange: (d: Date | undefined) => void
  startTime: string
  endTime: string
  onStartTimeChange: (t: string) => void
  onEndTimeChange: (t: string) => void
  onSearch: () => void
  className?: string
  size?: Size
  searchButtonProps?: React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean
    }
}

const SIZE_TOKENS: Record<
  Size,
  {
    container: string
    segment: string
    label: string
    value: string
    button: string
    clearIcon: string
    searchIcon: string
  }
> = {
  sm: {
    container: "rounded-full p-1 sm:rounded-xl sm:p-1",
    segment: "rounded-full px-3 py-1.5 sm:rounded-lg",
    label: "text-[11px]",
    value: "text-[13px]",
    button:
      "h-8 px-3 text-xs gap-1.5 rounded-full sm:h-auto sm:px-4 sm:py-1 sm:rounded-lg flex items-center justify-center",
    clearIcon: "size-3",
    searchIcon: "size-3.5",
  },
  md: {
    container: "rounded-full p-1 sm:rounded-2xl sm:p-1.5",
    segment: "rounded-full px-3 py-1.5 sm:rounded-xl sm:px-5 sm:py-2.5",
    label: "text-[13px]",
    value: "text-[14px] sm:text-[15px]",
    button:
      "h-9 px-4 text-sm gap-1.5 rounded-full sm:h-auto sm:px-6 sm:py-3 sm:text-[15px] sm:gap-2 sm:rounded-xl flex items-center justify-center",
    clearIcon: "size-3.5",
    searchIcon: "size-4",
  },
  lg: {
    container: "rounded-full p-1 sm:rounded-3xl sm:p-2",
    segment: "rounded-full px-3 py-1.5 sm:rounded-2xl sm:px-6 sm:py-3.5",
    label: "text-sm",
    value: "text-[14px] sm:text-base",
    button:
      "h-10 px-4 text-sm gap-2 rounded-full sm:h-auto sm:px-8 sm:py-4 sm:text-base sm:rounded-2xl flex items-center justify-center",
    clearIcon: "size-4",
    searchIcon: "size-4 sm:size-5",
  },
}

export function VenueSearchBar({
  mapsLoaded,
  planning,
  onPlanningChange,
  place,
  onPlaceChange,
  date,
  onDateChange,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  onSearch,
  className,
  size = "sm",
  searchButtonProps,
}: Props) {
  const acRef = React.useRef<google.maps.places.Autocomplete | null>(null)
  const [planOpen, setPlanOpen] = React.useState(false)
  const [whenOpen, setWhenOpen] = React.useState(false)
  const [whereFocused, setWhereFocused] = React.useState(false)

  const t = SIZE_TOKENS[size]

  const onPlaceChanged = React.useCallback(() => {
    const ac = acRef.current
    if (!ac) return
    const p = ac.getPlace()
    const loc = p.geometry?.location
    if (!loc) return
    const label = p.formatted_address ?? p.name ?? ""
    onPlaceChange({ lat: loc.lat(), lng: loc.lng(), label })
  }, [onPlaceChange])

  const whenSummary =
    date && startTime && endTime
      ? `${format(date, "MMM d")} · ${startTime} - ${endTime}`
      : date
        ? format(date, "MMM d")
        : "Pick date"

  // Segment composition
  const segmentBase = cn(
    "relative flex min-w-0 flex-1 flex-col justify-center text-left transition-all",
    t.segment
  )
  const segmentIdle = "bg-transparent hover:bg-muted/50"
  const segmentActive = "bg-background ring-1 ring-primary shadow-sm z-10"

  // On mobile, labels are hidden — only the value/placeholder is shown inline.
  const labelClass = cn("hidden sm:block font-medium text-muted-foreground", t.label)
  const valueClass = cn("truncate pr-5 font-semibold text-foreground sm:mt-0.5 sm:pr-6", t.value)
  const placeholderClass = cn(
    "truncate pr-5 font-normal text-muted-foreground sm:mt-0.5 sm:pr-6",
    t.value
  )
  const clearBtnClass =
    "absolute right-0 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:p-1"

  return (
    <div className={cn("relative w-full", className)}>
      <div
        className={cn(
          "flex flex-row items-stretch gap-0 border bg-background shadow-sm transition-shadow hover:shadow-md",
          t.container
        )}
      >
        {/* WHAT */}
        <Popover open={planOpen} onOpenChange={setPlanOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(segmentBase, planOpen ? segmentActive : segmentIdle)}
            >
              <span className={labelClass}>What are you planning?</span>
              <div className="relative">
                <span className={planning ? valueClass : placeholderClass}>
                  {planning || "All"}
                </span>
                {planning && (
                  <button
                    type="button"
                    className={clearBtnClass}
                    aria-label="Clear planning"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onPlanningChange("")
                    }}
                  >
                    <X className={t.clearIcon} />
                  </button>
                )}
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[min(100vw-2rem,380px)] rounded-xl border-border p-0 shadow-lg"
            align="start"
          >
            <Command className="rounded-xl">
              <CommandInput placeholder="Search activities..." />
              <CommandList>
                <CommandEmpty>No match.</CommandEmpty>
                <CommandGroup heading="Popular">
                  {PLANNING_OPTIONS.slice(0, 8).map((opt) => (
                    <CommandItem
                      key={opt}
                      value={opt}
                      onSelect={() => {
                        onPlanningChange(opt)
                        setPlanOpen(false)
                      }}
                    >
                      {opt}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandGroup heading="All">
                  {PLANNING_OPTIONS.slice(8).map((opt) => (
                    <CommandItem
                      key={opt}
                      value={opt}
                      onSelect={() => {
                        onPlanningChange(opt)
                        setPlanOpen(false)
                      }}
                    >
                      {opt}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* WHERE */}
        <div className={cn(segmentBase, whereFocused ? segmentActive : segmentIdle)}>
          <span className={labelClass}>Where?</span>
          {mapsLoaded ? (
            <div className="relative">
              <Autocomplete
                onLoad={(ac) => {
                  acRef.current = ac
                }}
                onPlaceChanged={onPlaceChanged}
                options={{
                  fields: ["formatted_address", "geometry", "name", "address_components"],
                }}
              >
                <input
                  key={place?.label ?? "no-place"}
                  className={cn(
                    "block w-full border-0 bg-transparent p-0 pr-5 outline-none sm:pr-6",
                    "font-semibold text-foreground placeholder:font-normal placeholder:text-muted-foreground",
                    t.value
                  )}
                  placeholder="Search for a location"
                  defaultValue={place?.label ?? ""}
                  onFocus={() => setWhereFocused(true)}
                  onBlur={() => setWhereFocused(false)}
                />
              </Autocomplete>
              {place && (
                <button
                  type="button"
                  className={cn(clearBtnClass, "z-10")}
                  aria-label="Clear location"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onPlaceChange(null)}
                >
                  <X className={t.clearIcon} />
                </button>
              )}
            </div>
          ) : (
            <p className={cn("text-muted-foreground sm:mt-0.5", t.value)}>Loading...</p>
          )}
        </div>

        {/* WHEN */}
        <Popover open={whenOpen} onOpenChange={setWhenOpen} modal={true}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(segmentBase, whenOpen ? segmentActive : segmentIdle)}
            >
              <span className={labelClass}>When?</span>
              <div className="relative">
                <span className={date ? valueClass : placeholderClass}>{whenSummary}</span>
                {date && (
                  <button
                    type="button"
                    className={clearBtnClass}
                    aria-label="Clear date"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onDateChange(undefined)
                    }}
                  >
                    <X className={t.clearIcon} />
                  </button>
                )}
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto max-w-[calc(100vw-2rem)] rounded-xl border-border bg-popover p-0 shadow-lg"
            align="end"
          >
            <DateTimePickerPanel
              date={date}
              startTime={startTime}
              endTime={endTime}
              onDateChange={onDateChange}
              onStartTimeChange={onStartTimeChange}
              onEndTimeChange={onEndTimeChange}
              calendarProps={{
                disabled: (date) => isBefore(date, startOfDay(new Date())),
              }}
            />
          </PopoverContent>
        </Popover>

        {/* SEARCH */}
        <div className="flex shrink-0 items-stretch sm:ml-1">
          <Button
            type="button"
            onClick={onSearch}
            className={cn(
              "w-full shrink-0 font-semibold shadow-sm transition-all hover:shadow-md sm:w-auto sm:self-stretch",
              t.button
            )}
            {...searchButtonProps}
          >
            <Search className={t.searchIcon} />
            <span className="hidden sm:inline">Search</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
