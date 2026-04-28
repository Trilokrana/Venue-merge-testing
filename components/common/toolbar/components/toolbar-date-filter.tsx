"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, XCircle } from "lucide-react"
import * as React from "react"
import type { DateRange } from "react-day-picker"

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function parseAsDate(raw: string | number | undefined): Date | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined
  const ts = typeof raw === "string" ? Number(raw) : raw
  if (Number.isNaN(ts)) return undefined
  const d = new Date(ts)
  return Number.isNaN(d.getTime()) ? undefined : d
}

function parseValue(value: string, multiple: boolean): DateRange | Date | undefined {
  if (!value) return multiple ? { from: undefined, to: undefined } : undefined
  if (multiple) {
    const [from, to] = value.split(",")
    return { from: parseAsDate(from), to: parseAsDate(to) }
  }
  return parseAsDate(value)
}

function serializeDate(date: Date | undefined): string {
  return date ? String(date.getTime()) : ""
}

/* -------------------------------------------------------------------------- */
/*  Props                                                                      */
/* -------------------------------------------------------------------------- */

/** The internal Calendar props we allow to be overridden. */
type CalendarPassthroughProps = Omit<
  React.ComponentProps<typeof Calendar>,
  "mode" | "selected" | "onSelect"
>

type TriggerPassthroughProps = Omit<React.ComponentProps<typeof Button>, "onClick" | "children">

interface ToolbarDateFilterProps {
  title?: string
  value: string
  onChange: (value: string | null) => void
  multiple?: boolean
  disabled?: boolean
  className?: string
  /** date-fns format token (defaults to "MMM d, yyyy"). */
  dateFormat?: string
  calendarProps?: CalendarPassthroughProps
  triggerProps?: TriggerPassthroughProps
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function ToolbarDateFilter({
  title,
  value,
  onChange,
  multiple,
  disabled,
  className,
  dateFormat = "MMM d, yyyy",
  calendarProps,
  triggerProps,
}: ToolbarDateFilterProps) {
  const parsed = React.useMemo(() => parseValue(value, !!multiple), [value, multiple])

  const hasValue = React.useMemo(() => {
    if (!parsed) return false
    if (multiple) {
      const r = parsed as DateRange
      return !!(r.from || r.to)
    }
    return !!parsed
  }, [parsed, multiple])

  const formatDate = React.useCallback((d: Date) => format(d, dateFormat), [dateFormat])

  const onSelectSingle = React.useCallback(
    (date: Date | undefined) => {
      onChange(date ? serializeDate(date) : null)
    },
    [onChange]
  )

  const onSelectRange = React.useCallback(
    (range: DateRange | undefined) => {
      if (!range || (!range.from && !range.to)) {
        onChange(null)
        return
      }
      onChange(`${serializeDate(range.from)},${serializeDate(range.to)}`)
    },
    [onChange]
  )

  const onReset = React.useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      onChange(null)
    },
    [onChange]
  )

  const label = React.useMemo(() => {
    if (multiple) {
      const r = (parsed as DateRange) ?? { from: undefined, to: undefined }
      const hasDates = r.from || r.to
      const dateText = hasDates
        ? r.from && r.to
          ? `${formatDate(r.from)} - ${formatDate(r.to)}`
          : formatDate((r.from ?? r.to) as Date)
        : "Select date range"

      return (
        <span className="flex items-center gap-2">
          <span>{title}</span>
          {hasDates && (
            <>
              <Separator
                orientation="vertical"
                className="mx-0.5 data-[orientation=vertical]:h-4"
              />
              <span>{dateText}</span>
            </>
          )}
        </span>
      )
    }

    const date = parsed as Date | undefined
    return (
      <span className="flex items-center gap-2">
        <span>{title}</span>
        {date && (
          <>
            <Separator orientation="vertical" className="mx-0.5 data-[orientation=vertical]:h-4" />
            <span>{formatDate(date)}</span>
          </>
        )}
      </span>
    )
  }, [parsed, multiple, title, formatDate])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          {...triggerProps}
          disabled={disabled ?? triggerProps?.disabled}
          className={cn("border-dashed font-normal", className, triggerProps?.className)}
        >
          {hasValue ? (
            <div
              role="button"
              aria-label={`Clear ${title} filter`}
              tabIndex={0}
              onClick={onReset}
              className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <XCircle />
            </div>
          ) : (
            <CalendarIcon />
          )}
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {multiple ? (
          <Calendar
            autoFocus
            captionLayout="dropdown"
            {...calendarProps}
            mode="range"
            selected={(parsed as DateRange) ?? { from: undefined, to: undefined }}
            onSelect={onSelectRange}
          />
        ) : (
          <Calendar
            captionLayout="dropdown"
            {...calendarProps}
            mode="single"
            selected={parsed as Date | undefined}
            onSelect={onSelectSingle}
          />
        )}
      </PopoverContent>
    </Popover>
  )
}
