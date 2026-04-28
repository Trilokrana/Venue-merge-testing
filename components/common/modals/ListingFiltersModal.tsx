import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useModalControlQuery } from "@/hooks/use-modal-control-query"
import { cn } from "@/lib/utils"
import { AMENITY_GROUPS } from "@/lib/venues/amenities"
import { X, XCircle } from "lucide-react"
import { parseAsString, useQueryState } from "nuqs"
import { useMemo } from "react"
import { ToolbarFacetedFilter } from "../toolbar/components/toolbar-faceted-filter"
// import { ToolbarRangeFilter } from "../toolbar/components/toolbar-range-filter"
import { Slider } from "@/components/ui/slider"
import * as React from "react"

interface ViewVenueModalProps {
  filterDialogControl: ReturnType<typeof useModalControlQuery>
}

const ListingFiltersModal = ({ filterDialogControl }: ViewVenueModalProps) => {
  const [price, setPrice] = useQueryState("price", parseAsString.withDefault("800"))
  const [capacity, setCapacity] = useQueryState("capacity", parseAsString.withDefault("500"))
  const [minHours, setMinHours] = useQueryState("min_hours", parseAsString.withDefault("24"))
  const [amenities, setAmenities] = useQueryState("amenities", parseAsString.withDefault(""))

  const amenitiesOptions = useMemo(() => {
    return [
      { label: "All groups", value: "" },
      ...AMENITY_GROUPS.flatMap((g) => g.items.map((i) => ({ label: i.label, value: i.id }))),
    ]
  }, [])
  return (
    <>
      <Dialog
        open={filterDialogControl?.control.open}
        onOpenChange={filterDialogControl?.control.onOpenChange}
      >
        <DialogContent
          showCloseButton={false}
          className={cn(
            "!flex h-[min(90vh,720px)] max-h-[min(90vh,720px)] w-full max-w-lg flex-col gap-0 overflow-hidden rounded-xl border-primary/25 bg-white p-0 sm:max-w-lg"
          )}
        >
          <DialogHeader className="shrink-0 border-b border-primary/15 px-6 py-4">
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-lg font-semibold">Filter Venues</DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 rounded-xl"
                onClick={() => filterDialogControl?.control.onOpenChange(false)}
              >
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6">
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <ToolbarFormRangeFilter
                  multiple={true}
                  value={price}
                  onChange={(value: string | null) => setPrice(value)}
                  min={1}
                  max={1000}
                  step={10}
                  unit="$"
                  label="Max Price Per Hour"
                  className="col-span-2"
                />
                <ToolbarFormRangeFilter
                  value={capacity}
                  onChange={(value: string | null) => setCapacity(value)}
                  min={0}
                  max={500}
                  step={10}
                  unit=" (people)"
                  label="Capacity"
                  className="col-span-2"
                />
                <ToolbarFormRangeFilter
                  value={minHours}
                  onChange={(value: string | null) => setMinHours(value)}
                  min={0}
                  max={24}
                  step={1}
                  unit="hrs"
                  label="Minimum Hours"
                  className="col-span-2"
                />
                <ToolbarFacetedFilter
                  value={amenities}
                  onChange={(value: string | null) => setAmenities(value)}
                  options={amenitiesOptions}
                  selectProps={{
                    popoverProps: { className: "w-auto" },
                  }}
                  title="Amenities"
                  className="col-span-2"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 grid grid-cols-2 gap-3 border-t border-primary/15 bg-white px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full rounded-lg border-primary/25 px-4 text-sm font-semibold"
              onClick={() => {
                setPrice("")
                setCapacity("")
                setMinHours("")
                setAmenities("")
              }}
            >
              Reset
            </Button>
            <Button
              type="button"
              // className="h-10 w-full rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                filterDialogControl?.control.onOpenChange(false)
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ListingFiltersModal

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

/** Props the shadcn Slider accepts, minus what this component controls. */
type SliderPassthroughProps = Omit<
  React.ComponentProps<typeof Slider>,
  "value" | "defaultValue" | "onValueChange" | "min" | "max" | "step"
>

interface ToolbarFormRangeFilterProps {
  /** Serialized "lo,hi" string (from URL). Empty string = no filter applied. */
  value: string
  /** Called with serialized "lo,hi" or null when cleared. */
  onChange: (value: string | null) => void
  min: number
  max: number
  step?: number
  /** Suffix for the readout, e.g. "$", "hrs". */
  unit?: string
  /** Custom formatter for the readout. Defaults to `${n}${unit}`. */
  formatValue?: (n: number) => string
  /** Passthrough for the underlying Slider. */
  sliderProps?: SliderPassthroughProps
  label?: string
  disabled?: boolean
  className?: string
  multiple?: boolean
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function ToolbarFormRangeFilter({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  formatValue,
  sliderProps,
  label,
  disabled,
  className,
  multiple = false,
}: ToolbarFormRangeFilterProps) {
  // Parse URL value. Shape depends on `multiple`:
  //   multiple=true  → [lo, hi]  (two thumbs)
  //   multiple=false → [v]       (one thumb)
  const parsed = React.useMemo<[number, number] | [number]>(() => {
    if (multiple) {
      if (!value) return [min, max]
      const [lo, hi] = value.split(",").map(Number)
      const safeLo = Number.isFinite(lo) ? Math.max(min, lo) : min
      const safeHi = Number.isFinite(hi) ? Math.min(max, hi) : max
      return [safeLo, safeHi]
    } else {
      if (!value) return [min]
      const num = Number(value)
      const safe = Number.isFinite(num) ? Math.min(max, Math.max(min, num)) : min
      return [safe]
    }
  }, [value, min, max, multiple])

  // "Active" means the user has moved away from the no-filter rest position.
  const isActive = multiple
    ? parsed[0] !== min || (parsed as [number, number])[1] !== max
    : parsed[0] !== min

  const fmt = formatValue ?? ((n: number) => `${n}${unit ?? ""}`)

  const handleChange = React.useCallback(
    (next: number[]) => {
      if (multiple) {
        const [lo, hi] = next as [number, number]
        // Clear URL param when the range equals the full bounds.
        if (lo === min && hi === max) onChange(null)
        else onChange(`${lo},${hi}`)
      } else {
        const [v] = next
        // Clear URL param when the thumb sits at the rest position.
        if (v === min) onChange(null)
        else onChange(String(v))
      }
    },
    [onChange, min, max, multiple]
  )

  const handleClear = React.useCallback(
    (event: React.MouseEvent | React.KeyboardEvent) => {
      event.stopPropagation()
      onChange(null)
    },
    [onChange]
  )

  const readout = multiple
    ? `${fmt(parsed[0])} – ${fmt((parsed as [number, number])[1])}`
    : fmt(parsed[0])

  return (
    <div
      className={cn("flex flex-col gap-4", disabled && "pointer-events-none opacity-50", className)}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {label && <span className="shrink-0 font-medium line-clamp-1">{label}</span>}
          {isActive && (
            <div
              role="button"
              aria-label={`Clear ${label ?? "range"} filter`}
              tabIndex={0}
              className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  handleClear(e)
                }
              }}
            >
              <XCircle className="size-4" />
            </div>
          )}
        </div>
        <span className="shrink-0 tabular-nums text-xs text-muted-foreground">{readout}</span>
      </div>
      <Slider
        {...sliderProps}
        min={min}
        max={max}
        step={step}
        value={parsed}
        onValueChange={handleChange}
        disabled={disabled ?? sliderProps?.disabled}
        className={cn("flex-1", sliderProps?.className)}
      />
    </div>
  )
}
