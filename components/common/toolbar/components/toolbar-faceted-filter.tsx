"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Check, PlusCircle, XCircle } from "lucide-react"
import * as React from "react"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type FacetedOption = {
  label: string
  value: string
  count?: number
  icon?: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

type SelectFilterProps = {
  popoverProps?: Omit<React.ComponentProps<typeof PopoverContent>, "children">
  commandProps?: Omit<React.ComponentProps<typeof Command>, "children">
  searchInputProps?: Omit<React.ComponentProps<typeof CommandInput>, "value" | "onValueChange">
  listProps?: Omit<React.ComponentProps<typeof CommandList>, "children">
  triggerProps?: Omit<React.ComponentProps<typeof Button>, "onClick" | "children">

  searchable?: boolean
  emptyMessage?: string
  closeOnSelect?: boolean
}

interface ToolbarFacetedFilterProps {
  title?: string
  value: string
  onChange: (value: string | null) => void
  options: FacetedOption[]
  multiple?: boolean
  disabled?: boolean
  className?: string
  selectProps?: SelectFilterProps
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function parseSelected(value: string): Set<string> {
  if (!value) return new Set()
  return new Set(value.split(",").filter(Boolean))
}

function serializeSelected(selected: Set<string>): string | null {
  if (selected.size === 0) return null
  return Array.from(selected).join(",")
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function ToolbarFacetedFilter({
  title,
  value,
  onChange,
  options,
  multiple,
  disabled,
  className,
  selectProps,
}: ToolbarFacetedFilterProps) {
  const [open, setOpen] = React.useState(false)

  const selectedValues = React.useMemo(() => parseSelected(value), [value])

  const {
    popoverProps,
    commandProps,
    searchInputProps,
    listProps,
    triggerProps,
    searchable = true,
    emptyMessage = "No results found.",
    closeOnSelect = true,
  } = selectProps ?? {}

  const onItemSelect = React.useCallback(
    (option: FacetedOption, isSelected: boolean) => {
      if (option.disabled) return

      if (multiple) {
        const next = new Set(selectedValues)
        if (isSelected) next.delete(option.value)
        else next.add(option.value)
        onChange(serializeSelected(next))
      } else {
        onChange(isSelected ? null : option.value)
        if (closeOnSelect) setOpen(false)
      }
    },
    [multiple, selectedValues, onChange, closeOnSelect]
  )

  const onReset = React.useCallback(
    (event?: React.MouseEvent) => {
      event?.stopPropagation()
      onChange(null)
    },
    [onChange]
  )

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          {...triggerProps}
          disabled={disabled ?? triggerProps?.disabled}
          className={cn("border-dashed font-normal", className, triggerProps?.className)}
        >
          {selectedValues.size > 0 ? (
            <div
              role="button"
              aria-label={`Clear ${title} filter`}
              tabIndex={0}
              className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onClick={onReset}
            >
              <XCircle />
            </div>
          ) : (
            <PlusCircle />
          )}
          {title}
          {selectedValues.size > 0 && (
            <>
              <Separator
                orientation="vertical"
                className="mx-0.5 data-[orientation=vertical]:h-4"
              />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selectedValues.size}
              </Badge>
              <div className="hidden items-center gap-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        {...popoverProps}
        className={cn("w-52 p-0 z-60", popoverProps?.className)}
      >
        <Command {...commandProps}>
          {searchable && <CommandInput placeholder={title} {...searchInputProps} />}
          <CommandList {...listProps} className={cn("max-h-full", listProps?.className)}>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup className="max-h-[300px] scroll-py-1 overflow-y-auto overflow-x-hidden">
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    disabled={option.disabled}
                    onSelect={() => onItemSelect(option, isSelected)}
                  >
                    <div
                      className={cn(
                        "flex size-4 items-center justify-center rounded-sm border border-primary",
                        isSelected ? "bg-primary" : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check />
                    </div>
                    {option.icon && <option.icon />}
                    <span className="truncate">{option.label}</span>
                    {option.count !== undefined && (
                      <span className="ml-auto font-mono text-xs">{option.count}</span>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={() => onReset()} className="justify-center text-center">
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
