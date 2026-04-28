"use client"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Loader2, MapPin } from "lucide-react"
import * as React from "react"
import usePlacesService from "react-google-autocomplete/lib/usePlacesAutocompleteService"

export interface PlacePrediction {
  place_id: string
  description: string
  structured_formatting?: {
    main_text: string
    secondary_text: string
  }
}

export interface GooglePlacesAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onPlaceSelected: (placeId: string, prediction: PlacePrediction) => void | Promise<void>
  onBlur?: () => void
  countryRestriction?: string | string[]
  placeholder?: string
  disabled?: boolean
  className?: string
  apiKey?: string
  debounce?: number
  minChars?: number
  name?: string
  showIcon?: boolean
}

const GooglePlacesAutocompleteInner = (
  props: GooglePlacesAutocompleteProps,
  ref: React.ForwardedRef<HTMLInputElement>
) => {
  const {
    value,
    onChange,
    onPlaceSelected,
    onBlur,
    countryRestriction,
    placeholder = "Start typing an address...",
    disabled,
    className,
    apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    debounce = 400,
    minChars = 2,
    name,
    showIcon = true,
  } = props

  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const { placePredictions, getPlacePredictions, isPlacePredictionsLoading } = usePlacesService({
    apiKey: apiKey ?? "",
    debounce,
    options: {
      componentRestrictions: countryRestriction ? { country: countryRestriction } : undefined,
      types: ["address"],
      input: "",
    },
  })

  React.useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  const predictions: PlacePrediction[] = (placePredictions ?? []) as PlacePrediction[]

  const handleSelect = async (prediction: PlacePrediction) => {
    const main = prediction.structured_formatting?.main_text ?? prediction.description
    onChange(main)
    setOpen(false)
    await onPlaceSelected(prediction.place_id, prediction)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        ref={ref}
        name={name}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(className)}
        onChange={(e) => {
          const val = e.target.value
          onChange(val)
          if (val.length >= minChars) {
            getPlacePredictions({ input: val })
            setOpen(true)
          } else {
            setOpen(false)
          }
        }}
        onFocus={() => {
          if (predictions.length > 0 && value.length >= minChars) {
            setOpen(true)
          }
        }}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false)
          }
        }}
      />

      {isPlacePredictionsLoading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground pointer-events-none" />
      )}

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          <Command shouldFilter={false}>
            <CommandList>
              {isPlacePredictionsLoading && predictions.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Searching...
                </div>
              )}

              {!isPlacePredictionsLoading && predictions.length === 0 && (
                <CommandEmpty>No addresses found.</CommandEmpty>
              )}

              {predictions.length > 0 && (
                <CommandGroup>
                  {predictions.map((prediction) => {
                    const main =
                      prediction.structured_formatting?.main_text ?? prediction.description
                    const secondary = prediction.structured_formatting?.secondary_text ?? ""

                    return (
                      <CommandItem
                        key={prediction.place_id}
                        value={prediction.place_id}
                        onSelect={() => handleSelect(prediction)}
                        onMouseDown={(e) => e.preventDefault()}
                        className={cn("cursor-pointer", {
                          "bg-accent text-accent-foreground": value === main,
                        })}
                      >
                        {showIcon && (
                          <MapPin className="mr-2 size-4 shrink-0 text-muted-foreground" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{main}</div>
                          {secondary && (
                            <div className="text-xs text-muted-foreground truncate">
                              {secondary}
                            </div>
                          )}
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}

export const GooglePlacesAutocomplete = React.forwardRef(GooglePlacesAutocompleteInner)
GooglePlacesAutocomplete.displayName = "GooglePlacesAutocomplete"
