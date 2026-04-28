"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Command, CommandInput, CommandList } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { PopoverContent } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { Search, X, XCircle } from "lucide-react"
import { parseAsString, useQueryStates } from "nuqs"
import * as React from "react"
import { ToolbarDateFilter } from "./components/toolbar-date-filter"
import { ToolbarFacetedFilter } from "./components/toolbar-faceted-filter"
import { ToolbarRangeFilter } from "./components/toolbar-range-filter"

/* -------------------------------------------------------------------------- */
/*  Shared types                                                               */
/* -------------------------------------------------------------------------- */

export type FilterVariant =
  | "text"
  | "search"
  | "number"
  | "date"
  | "dateRange"
  | "select"
  | "multiSelect"
  | "range" // NEW — numeric min/max slider
  | "button" // NEW — toggle-style button filter

export type FacetedOption = {
  label: string
  value: string
  count?: number
  icon?: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

type CommonFilterProps = {
  /** Unique URL param key, e.g. "search", "status". */
  key: string
  /** Human-readable label shown on the trigger. */
  label: string
  /** Initial value if no URL param is present. UI-only — doesn't pre-fill the URL. */
  defaultValue?: string
  /** Hide without unmounting (preserves URL state). */
  hidden?: boolean
  /** Disable the filter — useful while loading. */
  disabled?: boolean
  /** className applied to the filter's root element. */
  className?: string
}

/* -------------------------------------------------------------------------- */
/*  Per-variant shadcn-native prop types                                       */
/* -------------------------------------------------------------------------- */

/**
 * All props the shadcn <Slider /> accepts, minus the ones we control
 * internally (value/onValueChange/min/max/step — those come from RangeFilterConfig).
 */
export type SliderFilterProps = Omit<
  React.ComponentProps<typeof Slider>,
  "value" | "defaultValue" | "onValueChange" | "min" | "max" | "step"
>

/**
 * All props the shadcn <Button /> accepts, minus the ones we control
 * (onClick is owned by the toolbar, children is the label).
 */
export type ButtonFilterProps = Omit<React.ComponentProps<typeof Button>, "onClick" | "children">

/**
 * All props the shadcn <Input /> accepts, minus the ones we control
 * internally (value/onChange) and `type` for variants where the type is fixed.
 */
export type InputFilterProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "defaultValue"
>

/**
 * All props the shadcn <Input /> accepts for number variant — `type` is
 * fixed to "number" but everything else (min/max/step/inputMode/etc) flows
 * through natively.
 */
export type NumberInputFilterProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type" | "defaultValue"
>

/**
 * All props the shadcn <Calendar /> accepts, minus the ones we control
 * (mode/selected/onSelect — those are driven by the URL state).
 * This gives you full access to: captionLayout, buttonVariant, showOutsideDays,
 * classNames, components, formatters, locale, disabled, startMonth, endMonth,
 * required, weekStartsOn, fixedWeeks, numberOfMonths, pagedNavigation, etc.
 */
export type CalendarFilterProps = Omit<
  React.ComponentProps<typeof Calendar>,
  "mode" | "selected" | "onSelect"
>

/**
 * Props that customize the faceted popover (select/multiSelect).
 * Splits into three buckets, each typed against the underlying shadcn piece.
 */
export type SelectFilterProps = {
  /** Props for the popover content wrapper. */
  popoverProps?: Omit<React.ComponentProps<typeof PopoverContent>, "children">
  /** Props for the Command root inside the popover. */
  commandProps?: Omit<React.ComponentProps<typeof Command>, "children">
  /** Props for the search input inside the popover. */
  searchInputProps?: Omit<React.ComponentProps<typeof CommandInput>, "value" | "onValueChange">
  /** Props for the scrollable list wrapper. */
  listProps?: Omit<React.ComponentProps<typeof CommandList>, "children">
  /** Props for the trigger button. */
  triggerProps?: Omit<React.ComponentProps<typeof Button>, "onClick" | "children">

  /** Hide the search input inside the popover. Default: shown. */
  searchable?: boolean
  /** Custom empty-state text. Default: "No results found." */
  emptyMessage?: string
  /** Close popover after a single-select change. Default: true. */
  closeOnSelect?: boolean
}

/* -------------------------------------------------------------------------- */
/*  Discriminated union                                                        */
/* -------------------------------------------------------------------------- */

export type FilterOption =
  | (CommonFilterProps & {
      variant: "text"
      placeholder?: string
      inputProps?: InputFilterProps
    })
  | (CommonFilterProps & {
      variant: "search"
      placeholder?: string
      inputProps?: InputFilterProps
    })
  | (CommonFilterProps & {
      variant: "number"
      placeholder?: string
      /** Suffix shown inside the input, e.g. "$", "hrs". */
      unit?: string
      inputProps?: NumberInputFilterProps
    })
  | (CommonFilterProps & {
      variant: "date"
      /** Format token for the trigger label (date-fns). Default: "MMM d, yyyy". */
      dateFormat?: string
      calendarProps?: CalendarFilterProps
      triggerProps?: Omit<React.ComponentProps<typeof Button>, "onClick" | "children">
    })
  | (CommonFilterProps & {
      variant: "dateRange"
      dateFormat?: string
      calendarProps?: CalendarFilterProps
      triggerProps?: Omit<React.ComponentProps<typeof Button>, "onClick" | "children">
    })
  | (CommonFilterProps & {
      variant: "select"
      options: FacetedOption[]
      selectProps?: SelectFilterProps
    })
  | (CommonFilterProps & {
      variant: "multiSelect"
      options: FacetedOption[]
      selectProps?: SelectFilterProps
    })
  | (CommonFilterProps & {
      variant: "range"
      min: number
      max: number
      step?: number
      /** Suffix shown next to the min/max readout, e.g. "$", "hrs", "km". */
      unit?: string
      /** Format function for the readout labels. Defaults to `n => ${n}${unit ?? ""}`. */
      formatValue?: (n: number) => string
      sliderProps?: SliderFilterProps
    })
  | (CommonFilterProps & {
      variant: "button"
      /**
       * The URL value this button represents when active.
       * When the value in URL state === `activeValue`, the button is "on".
       * Clicking toggles between `activeValue` and empty string.
       */
      activeValue?: string
      /** Optional icon shown to the left of the label. */
      icon?: React.ComponentType<{ className?: string }>
      buttonProps?: ButtonFilterProps
    })

export type FilterValues = Record<string, string>

/* -------------------------------------------------------------------------- */
/*  Toolbar root                                                               */
/* -------------------------------------------------------------------------- */

interface RenderToolbarProps extends React.ComponentProps<"div"> {
  filterOptions: FilterOption[]
  /** Disable every filter at once (e.g. while loading). */
  disabled?: boolean
  /**
   * Optional callback fired whenever any filter changes.
   * Receives the FULL set of current filter values, not a partial diff.
   * Most consumers should read filter state directly from the URL via
   * `useQueryState` — this is for side-effects only.
   */
  onFiltersChange?: (filters: FilterValues) => void
  customBlock?: React.ReactNode
}

export function RenderToolbar({
  filterOptions,
  children,
  className,
  disabled = false,
  onFiltersChange,
  customBlock,
  ...props
}: RenderToolbarProps) {
  const parsers = React.useMemo(
    () =>
      Object.fromEntries(
        filterOptions.map((f) => [f.key, parseAsString.withDefault(f.defaultValue ?? "")])
      ),
    [filterOptions]
  )

  const [values, setValues] = useQueryStates(parsers, {
    history: "replace",
    shallow: true,
  })

  // Separate query state for pagination so filter changes can reset it to page 1.
  // Using `null` clears the param from the URL, which is equivalent to page 1.
  const [, setPage] = useQueryStates({ page: parseAsString }, { history: "replace", shallow: true })

  const isFiltered = React.useMemo(
    () => Object.values(values).some((v) => v && v.length > 0),
    [values]
  )

  const setFilterValue = React.useCallback(
    (key: string, value: string | null) => {
      setValues((prev) => {
        const next = { ...prev, [key]: value ?? "" }
        onFiltersChange?.(next)
        return next
      })
      // Any filter change bumps the user back to page 1 so results aren't
      // hidden behind a stale page offset.
      setPage({ page: null })
    },
    [setValues, setPage, onFiltersChange]
  )

  const onReset = React.useCallback(() => {
    const cleared = Object.fromEntries(filterOptions.map((f) => [f.key, null])) as Record<
      string,
      null
    >
    setPage({ page: null })
    setValues(cleared)

    const emptySnapshot = Object.fromEntries(filterOptions.map((f) => [f.key, ""])) as FilterValues
    onFiltersChange?.(emptySnapshot)
  }, [filterOptions, setValues, setPage, onFiltersChange])

  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn(
        "flex flex-col sm:flex-row w-full items-start justify-between gap-2 py-1",
        className
      )}
      {...props}
    >
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap flex-1 items-center gap-2">
        {filterOptions
          .filter((f) => !f.hidden)
          .map((filterOption) => (
            <RenderToolbarFilter
              key={filterOption.key}
              filterOption={filterOption}
              value={values[filterOption.key] ?? ""}
              onChange={(v) => setFilterValue(filterOption.key, v)}
              disabled={disabled || filterOption.disabled}
            />
          ))}

        {customBlock && customBlock}

        {isFiltered && (
          <Button
            aria-label="Reset filters"
            variant="outline"
            size="sm"
            className="border-dashed"
            onClick={onReset}
            disabled={disabled}
          >
            <X />
            Reset
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Dispatch                                                                   */
/* -------------------------------------------------------------------------- */

interface RenderToolbarFilterProps {
  filterOption: FilterOption
  value: string
  onChange: (value: string | null) => void
  disabled?: boolean
}

function RenderToolbarFilter({
  filterOption,
  value,
  onChange,
  disabled,
}: RenderToolbarFilterProps) {
  switch (filterOption.variant) {
    case "text": {
      const { inputProps, placeholder, label, className } = filterOption
      return (
        <Input
          placeholder={placeholder ?? label}
          {...inputProps}
          value={value}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled ?? inputProps?.disabled}
          className={cn("shadow-xs h-8 w-40 lg:w-56", className, inputProps?.className)}
        />
      )
    }

    case "search": {
      const { inputProps, placeholder, label, className } = filterOption
      return (
        <div
          className={cn(
            "shadow-xs col-span-2 sm:col-span-1 relative flex-1 w-full sm:min-w-40 sm:w-auto sm:max-w-56",
            className
          )}
        >
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={placeholder ?? label}
            {...inputProps}
            value={value}
            onChange={(e) => onChange(e.target.value || null)}
            disabled={disabled ?? inputProps?.disabled}
            className={cn(
              "pl-8 h-8 text-sm bg-muted/50 border-border shadow-none focus-visible:ring-1 rounded-md",
              inputProps?.className
            )}
          />
        </div>
      )
    }

    case "number": {
      const { inputProps, placeholder, label, unit, className } = filterOption
      return (
        <div className={cn("relative", className)}>
          <Input
            inputMode="numeric"
            placeholder={placeholder ?? label}
            {...inputProps}
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value || null)}
            disabled={disabled ?? inputProps?.disabled}
            className={cn("h-8 w-[120px] shadow-xs", unit && "pr-8", inputProps?.className)}
          />
          {unit && (
            <span className="absolute top-0 right-0 bottom-0 flex items-center rounded-r-md bg-accent px-2 text-muted-foreground text-sm">
              {unit}
            </span>
          )}
        </div>
      )
    }

    case "date":
    case "dateRange": {
      const { calendarProps, triggerProps, dateFormat, label, className } = filterOption
      return (
        <ToolbarDateFilter
          title={label}
          value={value}
          onChange={onChange}
          disabled={disabled}
          multiple={filterOption.variant === "dateRange"}
          className={className}
          dateFormat={dateFormat}
          calendarProps={calendarProps}
          triggerProps={triggerProps}
        />
      )
    }

    case "select":
    case "multiSelect": {
      const { selectProps, label, options, className } = filterOption
      return (
        <ToolbarFacetedFilter
          title={label}
          value={value}
          onChange={onChange}
          options={options}
          multiple={filterOption.variant === "multiSelect"}
          disabled={disabled}
          className={className}
          selectProps={selectProps}
        />
      )
    }

    case "range": {
      const { min, max, step, unit, formatValue, sliderProps, label, className } = filterOption
      return (
        <ToolbarRangeFilter
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          unit={unit}
          formatValue={formatValue}
          sliderProps={sliderProps}
          label={label}
          disabled={disabled}
          className={className}
        />
      )
    }

    case "button": {
      const { activeValue = "1", icon: Icon, buttonProps, label, className } = filterOption
      const isActive = value === activeValue

      return (
        <Button
          type="button"
          variant={isActive ? "default" : "outline"}
          size="sm"
          {...buttonProps}
          disabled={disabled ?? buttonProps?.disabled}
          onClick={() => onChange(isActive ? null : activeValue)}
          className={cn(
            !isActive && "border-dashed font-normal",
            className,
            buttonProps?.className
          )}
        >
          {Icon ? (
            <Icon className="size-4" />
          ) : isActive ? (
            <div
              role="button"
              aria-label={`Clear ${label} filter`}
              tabIndex={0}
              className="z-10 size-sm rounded-sm transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onClick={() => onChange(null)}
            >
              <XCircle className="size-4" />
            </div>
          ) : null}
          {label}
          {/* {isActive && <X className="size-3.5 opacity-70" />} */}
        </Button>
      )
    }

    default:
      return null
  }
}
