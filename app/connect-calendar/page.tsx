import { getCronofyConnectPublicConfig } from "@/lib/cronofy/config"
import { createSupabaseServerClient } from "@/lib/supabase/server-client"
import { redirect } from "next/navigation"
import { CalendarConnectedSuccessPanel } from "./components/CalendarConnectedSuccessPanel"
import { ConnectCalendarClient } from "./components/ConnectCalendarClient"

const CRONOFY_ELEMENTS_SCRIPT = "https://elements.cronofy.com/js/CronofyElements.v1.67.6.js"

function firstParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0]
  return v
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ConnectCalendarPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {}
  const freshOAuthSuccess = firstParam(sp.success) === "1"
  const oauthError = firstParam(sp.error) ?? null

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login?next=/connect-calendar")
  }

  const connect = getCronofyConnectPublicConfig()
  if (!connect) {
    return (
      <div className="container max-w-2xl py-12">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive">
          <p className="mb-2 font-medium">Cronofy not configured.</p>
          <p className="text-destructive/90">
            In{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              .env.local
            </code>{" "}
            set{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              CRONOFY_CLIENT_ID
            </code>
            ,{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              CRONOFY_CLIENT_SECRET
            </code>
            , and{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              CRONOFY_REDIRECT_URI
            </code>{" "}
            (e.g.{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              http://localhost:3000/api/cronofy/callback
            </code>
            ). Optional for UI pages:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              NEXT_PUBLIC_CRONOFY_CLIENT_ID
            </code>{" "}
            and{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              NEXT_PUBLIC_CRONOFY_REDIRECT_URI
            </code>
            . Restart{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              npm run dev
            </code>{" "}
            after saving.
          </p>
        </div>
      </div>
    )
  }
  const { clientId, redirectUri, dataCenter } = connect

  const { data: existing } = await supabase
    .from("cronofy_credentials")
    .select("sub")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  const connected = Boolean(existing?.sub)

  if (connected && existing?.sub) {
    return (
      <div className="container max-w-4xl py-12">
        <CalendarConnectedSuccessPanel
          freshOAuthSuccess={freshOAuthSuccess}
          oauthError={oauthError}
        />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-12">
      sahjcbhj
      <div className="mb-8 space-y-2 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold">Connect your calendar</h1>
        <p className="text-sm text-muted-foreground">
          Link Google, Outlook, Apple, or other calendars so your venue availability stays in sync.
        </p>
      </div>
      <ConnectCalendarClient
        scriptUrl={CRONOFY_ELEMENTS_SCRIPT}
        dataCenter={dataCenter}
        authorization={{
          client_id: clientId,
          redirect_uri: redirectUri,
          scope: "read_write",
          state: user.id,
        }}
        hasExistingCredentials={false}
      />
    </div>
  )
}
