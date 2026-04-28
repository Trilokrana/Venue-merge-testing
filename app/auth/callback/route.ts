import { createSupabaseServerClient } from "@/lib/supabase/server-client"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`
      )
    }
    // ** LOGIN SUCCESS **
    // Get user AFTER session is created
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const accountType = user.user_metadata?.account_type

      // 🔥 If account_type is missing → set default
      if (!accountType) {
        const defaultRole = "rentee"
        
        const fullName = user.user_metadata?.first_name 
          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim() 
          : null;
        const displayName = user.user_metadata?.full_name || user.user_metadata?.name || fullName || null

        const photoUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null

        await Promise.all([
          // ✅ Update metadata
          supabase.auth.updateUser({
            data: {
              account_type: defaultRole,
            },
          }),

          // ✅ Sync with your public.users table
          supabase.from("users").upsert({
            id: user.id,
            account_type: defaultRole,
            display_name: displayName,
            photo_url: photoUrl,
          }),
        ])
      }
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}${next}`)
}
