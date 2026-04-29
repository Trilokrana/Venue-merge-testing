"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { useModalControlQuery } from "@/hooks/use-modal-control-query"
import { VenueWithRelations } from "@/lib/venues/types"
import { Loader2 } from "lucide-react"
import { parseAsString, useQueryState } from "nuqs"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { VenueCard } from "../cards/VenueCard"

interface DeleteVenueModalProps {
  venue: VenueWithRelations
  dialogControl: ReturnType<typeof useModalControlQuery>
  onConfirm: (id: string) => Promise<void>
  isLoading: boolean
}

export function DeleteVenueModal({
  venue,
  dialogControl,
  onConfirm,
  isLoading,
}: DeleteVenueModalProps) {
  const [value, setValue] = useState<string>("")
  const [view] = useQueryState("mode", parseAsString.withDefault("grid"))
  useEffect(() => {
    if (!dialogControl?.control.open) {
      setTimeout(() => {
        setValue("")
      }, 100)
    }
  }, [dialogControl?.control.open])
  const isMatch = value.trim() === venue?.name?.trim()
  return (
    <AlertDialog
      open={dialogControl?.control.open}
      onOpenChange={dialogControl?.control.onOpenChange}
    >
      <AlertDialogContent
        onEscapeKeyDown={(e) => {
          e.preventDefault()
        }}
        className="flex max-h-[min(600px,90dvh)] flex-col sm:max-w-md"
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            This action cannot be undone. This will permanently delete the venue from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {/* <ScrollArea className="flex max-h-full flex-col overflow-hidden"> */}
        <div className="flex-1 overflow-y-auto">
          <div className="mb-4">
            <p className="text-sm">
              Please Type <span className="text-destructive">{venue?.name}</span> to confirm
            </p>
            <Input
              type="text"
              placeholder="Enter the name of the venue to delete"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-2"
            />
          </div>
          <div className="p-1">
            <VenueCard
              variant={view === "list" ? "list" : ("default" as "list" | "default")}
              venue={venue}
              isOwnerView={false}
            />
          </div>
        </div>
        {/* </ScrollArea> */}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={async (e) => {
              e.preventDefault() // 🚀 STOP auto close
              if (!isMatch) {
                toast.error("Please enter the correct name")
                return
              }
              await onConfirm(venue.id)
            }}
            disabled={isLoading || !isMatch}
          >
            {isLoading ? (
              <>
                Deleting...
                <Loader2 className="w-4 h-4 animate-spin" />
              </>
            ) : (
              "Delete Venue"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
