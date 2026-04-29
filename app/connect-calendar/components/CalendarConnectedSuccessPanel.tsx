import { ArrowRight, CalendarRange, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import IconWrapper from "@/components/ui/icon-wrapper"
import { cn } from "@/lib/utils"

type Props = {
  /** e.g. Venues / … / Calendar sync — nudged upward under the dashboard shell */
  breadcrumb?: ReactNode
  /** When set, shows listing strip + link to this venue’s availability calendar */
  venueId?: string
  venueName?: string
  /** User just returned from OAuth with `?success=1` */
  freshOAuthSuccess: boolean
  /** Optional OAuth / save error code from query string */
  oauthError?: string | null
  className?: string
}

function safeErrorLabel(code: string) {
  try {
    return decodeURIComponent(code)
  } catch {
    return code
  }
}

export function CalendarConnectedSuccessPanel({
  breadcrumb,
  venueId,
  venueName,
  freshOAuthSuccess,
  oauthError,
  className,
}: Props) {
  const isVenue = Boolean(venueId && venueName)
  const title = freshOAuthSuccess ? "Calendar connected successfully" : "Calendar connected"

  return (
    <div className={cn("space-y-6", className)}>
      {breadcrumb ? breadcrumb : null}

      {oauthError ? (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            {safeErrorLabel(oauthError)}. Try connecting again
            {isVenue ? " from this page or your venue list." : "."}
          </AlertDescription>
        </Alert>
      ) : null}

      <div
        className={cn("relative overflow-hidden rounded-xl border bg-card", "p-4 shadow-sm sm:p-4")}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          <IconWrapper variant="secondary">
            <CheckCircle2 className="size-4 text-primary" />
          </IconWrapper>
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground">
              Your calendars are linked. Availability will use your linked calendars for accurate
              booking windows.
            </p>

            {isVenue && venueName ? (
              <div className="mt-4 flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Listing</span>
                <span className="text-muted-foreground/60">·</span>
                <span className="truncate font-medium text-foreground">{venueName}</span>
              </div>
            ) : null}

            {isVenue && venueId ? (
              <div className="pt-3">
                <Link
                  href={`/venues/${venueId}/calendar`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  <Button>
                    <CalendarRange className="size-4 shrink-0" aria-hidden />
                    <span>Open availability calendar</span>
                    <ArrowRight
                      className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </Button>
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
