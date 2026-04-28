"use client"

import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { XCircle } from "lucide-react"
import * as React from "react"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

/** Props the shadcn Slider accepts, minus what this component controls. */
type SliderPassthroughProps = Omit<
  React.ComponentProps<typeof Slider>,
  "value" | "defaultValue" | "onValueChange" | "min" | "max" | "step"
>

interface ToolbarRangeFilterProps {
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

export function ToolbarRangeFilter({
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
  multiple = true,
}: ToolbarRangeFilterProps) {
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
      className={cn(
        "flex h-8 min-w-66 items-center gap-2 rounded-md border border-dashed px-3 text-sm",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
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

      {label && <span className="shrink-0 font-medium">{label}</span>}

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

      <span className="shrink-0 tabular-nums text-xs text-muted-foreground">{readout}</span>
    </div>
  )
}
